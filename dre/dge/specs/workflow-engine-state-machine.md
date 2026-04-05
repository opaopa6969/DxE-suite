# Spec: DRE Workflow Engine / State Machine

**Source:** DGE session 2026-04-03  
**Status:** Ready for implementation  
**Gaps addressed:** G-01〜G-15（全解消）

---

## UC — ユースケース

### UC-01: フェーズ内の選択肢ドリルダウンと復帰
1. engine が `PRESENTING_OPTIONS` 状態に入り選択肢 A〜D を LLM に提示させる
2. ユーザーが A を選ぶ → engine がスタックに `PRESENTING_OPTIONS` を push し `DRILLING_A` に遷移
3. A のドリルダウン完了 → engine がスタックを pop し `PRESENTING_OPTIONS` に戻る
4. context から `remaining: [B, C, D]` を読み、LLM に残りの選択肢を提示させる
5. 全選択肢が完了したら次フェーズへ遷移

### UC-02: plugin install 時の state machine 更新
1. `npx dge-install` を実行
2. DGE の plugin manifest を読み込む
3. `.dre/state-machine.yaml` に `gap_extraction` フェーズを merge
4. manifest の静的 validation（必須フィールド、ordering 重複）を実行
5. 失敗なら install を中断してエラーを表示

### UC-03: PRE_CHECK_FAILED からの復帰
1. engine がフェーズ開始前に `side_effects.reads` を確認
2. ファイルが存在しない → `PRE_CHECK_FAILED` 状態に遷移
3. ユーザーに3択を提示（ファイル作成・スキップ・前段フェーズへ戻る）
4. 「前段へ戻る」を選択 → context.json からフレームを読み戻し前段状態を復元

---

## TECH — 技術仕様

### ファイル構成

```
.dre/
├── state-machine.yaml   # SM Definition（plugin install 時に自動更新）
└── context.json         # 実行時の stack と frames（hook が読み書き）
```

### tool レスポンス スキーマ

```json
{
  "state": "OPTION_DRILL",
  "stack": ["PRESENTING_OPTIONS"],
  "transition": {
    "on_complete": "POP",
    "on_abort": "POP"
  },
  "context": {
    "option_selected": "A",
    "remaining": ["B", "C", "D"]
  },
  "side_effects": {
    "reads": [],
    "writes": []
  }
}
```

### plugin manifest スキーマ

```yaml
plugin:
  id: dge
  phases:
    - id: gap_extraction
      insert_after: spec
      ordering: 100          # 低いほど先に実行（複数 plugin の順序）
      loop_until: remaining_gaps == 0
      inputs:
        - spec_file
      outputs:
        - gap_list
      side_effects:
        - writes: dge/sessions/
```

### .dre/state-machine.yaml スキーマ

```yaml
version: 1
phases:
  - id: backlog
    next: spec
  - id: spec
    next: impl
    plugins_before:
      - dge              # DGE install で追加
  - id: impl
    next: review
  - id: review
    next: release
    plugins_after:
      - dde              # DDE install で追加
  - id: release
    next: null
```

### .dre/context.json スキーマ

```json
{
  "stack": ["PRESENTING_OPTIONS", "SPEC"],
  "frames": {
    "PRESENTING_OPTIONS": {
      "options": ["A", "B", "C", "D"],
      "remaining": ["B", "C", "D"]
    },
    "SPEC": {
      "spec_file": "docs/spec.md",
      "last_modified": "2026-04-03T00:00:00Z"
    }
  }
}
```

### Claude Code hook 構成

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": ".dre/hooks/post-tool-use.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Read .dre/context.json. If stack is non-empty and remaining options exist, return {\"ok\": false, \"reason\": \"Stack has pending items: <remaining>. Please present these options to the user.\"}. Otherwise return {\"ok\": true}."
          }
        ]
      }
    ]
  }
}
```

#### post-tool-use.sh の責務

```bash
#!/usr/bin/env bash
# stdin から tool_result を読んで .dre/context.json を更新する
INPUT=$(cat)
STATE=$(echo "$INPUT" | jq -r '.tool_result.content' | jq -r '.state // empty')
[ -z "$STATE" ] && exit 0

# stack / frames を context.json に書き込む
echo "$INPUT" | jq '.tool_result.content | {stack, frames: .context}' > .dre/context.json
```

---

## ADR — アーキテクチャ決定記録

### ADR-01: LLM を orchestrator ではなく executor にする

**決定:** engine（Claude Code hook）が状態遷移を管理する。LLM はツールを呼んで結果を表示するだけ。

**理由:** LLM を orchestrator にするとコンテキストウィンドウの中でしか状態が生きず、スタックフレームが消える（G-01/G-03）。

**トレードオフ:** hook に状態遷移ロジックが入るため hook のテストが必要になる（SM Definition を YAML に分離して静的検証で対応）。

### ADR-02: Claude Code hook を engine に採用する

**決定:** 外部プロセスを立てず、Claude Code の PostToolUse + Stop hook を engine とする。

**理由:** 最小コスト。新しいランタイムの導入不要。Claude Code の仕様に乗っかれる。

**制約:** PostToolUse の stdout は LLM に注入されない。Stop hook（prompt型）で補う。

### ADR-03: plugin manifest でライフサイクルを宣言する

**決定:** Maven の plugin descriptor パターンを採用。plugin が自分の挿入位置（insert_after）と ordering を宣言する。

**理由:** engine 側を変更せずに plugin を追加できる（G-04/G-08）。DxE シリーズの拡張が容易。

### ADR-04: context を .dre/context.json に serialise する

**決定:** 実行時の stack と frames を JSON ファイルに永続化する。

**理由:** フェーズをまたぐ context の保持と、前段フェーズへの戻りを実現するため（G-15）。git で差分管理可能。

---

## ACT — 実装アクション（優先度順）

1. `.dre/hooks/post-tool-use.sh` を実装（tool_result → context.json 更新）
2. Stop hook の prompt を settings.json に追加
3. `.dre/state-machine.yaml` のベース定義を作成
4. `dre-tool install-plugin <manifest>` コマンドを実装（manifest validation + SM merge）
5. SM Definition の静的検証テストを実装（dead state 検出、POP 戻り先検証）
6. `PRE_CHECK_FAILED` の3択 UI を tool レスポンスで実装
7. DGE / DDE の plugin manifest を作成

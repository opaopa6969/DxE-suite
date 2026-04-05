# DGE Session — DRE workflow engine / state machine 設計
**日時:** 2026-04-03  
**テーマ:** DRE/DGE ループが閉じない問題。スタック管理・plugin 統合・state machine によるワークフローエンジン設計  
**キャラ:** ヤン・今泉・川口（custom）・ムーア（custom）  
**構造:** 🗣 座談会（6ラウンド、自動反復）

---

## Gap 一覧（最終）

| # | Gap | Category | Severity | 状態 |
|---|---|---|---|---|
| G-01 | 中間状態（RETURNED_FROM_A等）が未定義。rules はステートレスで構造的に保持不可 | ARCH | Critical | ✅ SM Definition + stack |
| G-02 | tool レスポンスの出力スキーマ未定義 | SPEC | High | ✅ JSON スキーマ設計 |
| G-03 | workflow engine の実体未決定（tool一本 vs 外部プロセス） | ARCH | High | ✅ Claude Code hook を engine に決定 |
| G-04 | plugin が lifecycle フェーズに挿入される位置の宣言フォーマット未定義 | SPEC | High | ✅ plugin manifest（YAML）|
| G-05 | ループ終了条件の評価主体が未定義 | ARCH | Medium | ✅ hook が SM Definition を評価 |
| G-06 | LLM を orchestrator にすると state 管理がコンテキスト依存。hook の制約が未検証 | ARCH | Critical | 🟡 要実験 |
| G-07 | tool レスポンスを LLM が無視できない強制機構未定義 | SPEC | High | ✅ hook が next prompt に context 埋め込み |
| G-08 | 複数 plugin が同一 phase に insert した場合の ordering 未定義 | SPEC | High | ✅ manifest の ordering フィールド |
| G-09 | POP 後の残り選択肢プロンプト生成の責任分担未定義 | SPEC | Medium | ✅ hook=controller, tool=model |
| G-10 | side_effects.reads 宣言ファイル不在時の fallback 未定義 | SPEC | Medium | ✅ PRE_CHECK_FAILED → 3択 |
| G-11 | SM Definition のファイルフォーマットと配置未定義 | SPEC | High | ✅ .dre/state-machine.yaml |
| G-12 | hook のテスト戦略未定義 | SPEC | Medium | ✅ SM Definition 静的検証 |
| G-13 | PRE_CHECK_FAILED の通知内容とユーザーアクション未定義 | SPEC | Medium | ✅ 3択 UI、tool レスポンスで返す |
| G-14 | plugin manifest の validation 未定義 | SPEC | Low | ✅ install 時 dre-tool が静的検証 |
| G-15 | 前段フェーズへ戻る時の context 保持未定義 | ARCH | High | ✅ .dre/context.json にフレーム serialise |

---

## 設計サマリー

```
plugin manifest (YAML)
    ↓ install 時 merge + validate
.dre/state-machine.yaml  ← SM Definition（静的検証可能）
    ↓
Claude Code hook (engine / controller)
    ├─ .dre/context.json を読み書き（stack + frames）
    ├─ SM Definition に従って next state を決定
    └─ next prompt を生成して LLM へ

LLM (executor)
    └─ tool を呼ぶ

tool (model)
    └─ { state, stack, transition, context, side_effects } を返す
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
      ordering: 100
      loop_until: remaining_gaps == 0
      inputs:
        - spec_file
      outputs:
        - gap_list
      side_effects:
        - writes: dge/sessions/
```

### .dre/context.json スキーマ

```json
{
  "stack": ["PRESENTING_OPTIONS", "SPEC"],
  "frames": {
    "PRESENTING_OPTIONS": {
      "options": ["A","B","C","D"],
      "remaining": ["B","C","D"]
    },
    "SPEC": {
      "spec_file": "docs/spec.md",
      "last_modified": "2026-04-03T00:00:00Z"
    }
  }
}
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
      - dge
  - id: impl
    next: review
  - id: review
    next: release
    plugins_after:
      - dde
  - id: release
    next: null
```

---

## 未解決（要実験）

**G-06:** Claude Code hook（PostToolUse）が `.dre/context.json` を実際に読み書きできるか。  
hook が生成した next prompt を LLM へ強制注入できるか。  
→ 実験で確認してから Spec 化。

# DGE Document Map — 何がどこに影響するか

## 概要

DGEワークフローは複数の成果物を生成し、それらはAskOSの既存ドキュメント群と `.claude/` 配下の設定群に影響する。この文書はその全体像を整理する。

---

## 1. AskOS ファイル構造と DGE の関係

```
AskOS-main/
│
├── .claude/                              ← DGE実行環境
│   ├── output-styles/
│   │   └── dge-writer.md                 DGEのドキュメント品質スタイル定義
│   ├── agents/
│   │   └── dge-analyst.md                POC分析専用サブエージェント
│   ├── commands/
│   │   └── dge.md                        /dge コマンド定義
│   ├── skills/
│   │   └── dge/
│   │       └── SKILL.md                  DGEスキル定義（本体）
│   └── settings.json                     (hallucination_check等の設定)
│
├── askos-stories/                        ← DGE成果物の蓄積先（手動DGE）
│   ├── 01-onboarding/                    ストーリーカテゴリ別
│   │   ├── 01-first-boot.md              各ストーリー
│   │   └── ...
│   ├── 99-reference/                     ★ DGE Phase 3 出力のマージ先
│   │   ├── use-cases.md                  ← dge-output/*/use-cases.md をマージ
│   │   ├── spec-implications.md          ← dge-output/*/spec-implications.md をマージ
│   │   ├── data-model-changes.md         ← dge-output/*/gap-analysis.md から抽出
│   │   └── next-steps.md
│   └── README.md                         ストーリー索引（新ストーリー追加時に更新）
│
├── docs/                                 ← DGE発見のspec反映先
│   ├── spec.md                           ★ gap-analysis の architecture_changes を反映
│   ├── spec-gap-from-stories.md          ★ gap-analysis の全内容を新セクションとして追加
│   ├── data-model.md                     ★ gap-analysis の data_model_changes を反映
│   ├── architecture.md                   ★ gap-analysis の architecture_changes を反映
│   ├── api-surface.md                    ★ gap-analysis の api_changes を反映
│   ├── backlog.md                        ★ gap-analysis の implementation_priority を反映
│   ├── use-cases-agent-runtime.md        use-cases.md の agent関連部分を反映
│   └── implementation-status.md          実装完了後にステータス更新
│
├── dge-output/                           ← DGE自動出力先（ワークフロー実行時）
│   └── {feature-name}/
│       ├── dialogue-v1.md                会話劇（イテレーションごとにv1, v2, ...）
│       ├── validation-report.md          hallucination検証結果
│       ├── use-cases.md                  Use Case一覧
│       ├── spec-implications.md          Spec Implications
│       ├── gap-analysis.md               Gap分析
│       └── handover-to-claude-code.md    実装ハンドオーバー
│
├── handover/                             ← DGE handover文書の統合先
│   └── handover-to-claude-code.md        ★ dge-output/*/handover.md の内容を統合
│
├── specs/
│   └── workflow-engine/
│       └── examples/
│           └── dge/                      ← DGEワークフローYAML定義
│               ├── dge-spec-discovery.yaml   (v1)
│               └── dge-spec-discovery-v2.yaml (v2)
│
└── migrations/                           ← gap-analysisのdata_model_changesからSQL生成
    └── NNN_dge_{feature}.sql
```

---

## 2. DGE出力 → 既存ドキュメント 更新ルール

### 2.1 マージ（追記）

| DGE出力 | 更新先 | ルール |
|---------|--------|--------|
| `use-cases.md` | `askos-stories/99-reference/use-cases.md` | カテゴリ別に追記。既存UCとID重複しないよう採番 |
| `spec-implications.md` | `askos-stories/99-reference/spec-implications.md` | 末尾に新セクション追加 |
| `gap-analysis.md` | `docs/spec-gap-from-stories.md` | 機能名セクションとして追加 |
| `dialogue-v*.md` | `askos-stories/{nn}-{category}/` | 新ストーリーとして配置。README.mdの索引も更新 |

### 2.2 差分反映（既存文書の修正）

| DGE出力のセクション | 更新先 | ルール |
|---------------------|--------|--------|
| `gap-analysis.data_model_changes` | `docs/data-model.md` | 新テーブル/カラムを追記。既存定義と矛盾する場合はコメントで注記 |
| `gap-analysis.architecture_changes` | `docs/architecture.md` | "current → discovered" の差分を反映 |
| `gap-analysis.api_changes` | `docs/api-surface.md` | 新エンドポイントを追加 |
| `gap-analysis.implementation_priority` | `docs/backlog.md` | Tier別にバックログ項目を追加 |
| `handover-to-claude-code.md` | `handover/handover-to-claude-code.md` | 新機能セクションとして追加 |

### 2.3 生成（新規作成）

| DGE出力 | 生成先 | ルール |
|---------|--------|--------|
| `gap-analysis.data_model_changes[].sql_sketch` | `migrations/NNN_dge_{feature}.sql` | SQLスケッチを正式なmigrationに昇格 |

---

## 3. .claude/ 配下の設定ファイル解説

### 3.1 全体構造

```
.claude/
├── output-styles/     出力のトーン・フォーマットを制御する永続設定
│                      → /dge 実行時に dge-writer スタイルが自動適用される
│
├── agents/            特化型サブエージェント定義
│                      → verify-poc 時に dge-analyst が呼ばれる
│
├── commands/          カスタムスラッシュコマンド
│                      → /dge コマンドのエントリポイント
│
├── skills/            複合的な機能定義（コマンド + スタイル + ロジック）
│   └── dge/           → DGE全体のオーケストレーション
│       └── SKILL.md   → パターン選択、出力先制御、フロー管理
│
└── settings.json      グローバル設定
                       → hallucination_check, dge_max_iterations 等
```

### 3.2 各ファイルの役割

| ファイル | 役割 | いつ読まれるか | 編集頻度 |
|---------|------|---------------|---------|
| `output-styles/dge-writer.md` | ドキュメント生成時のトーン・品質基準 | DGEのPhase 2, 3実行時 | 低（初回設定後はほぼ不変） |
| `agents/dge-analyst.md` | verify-poc専用の分析プロンプト | Phase 1, validate-dialogue実行時 | 低 |
| `commands/dge.md` | `/dge` コマンドのヘルプと引数定義 | `/dge` 入力時 | 中（パターン追加時） |
| `skills/dge/SKILL.md` | DGE全体のフロー定義・パターン定義 | `/dge` 実行時 | 中（ワークフロー改善時） |
| `settings.json` | グローバル設定値 | 全セッション開始時 | 低 |

### 3.3 Output Style vs Agent vs Skill vs Command の違い

| 概念 | 何か | いつ使うか | DGEでの用途 |
|------|------|----------|------------|
| **Output Style** | 出力フォーマットの永続設定 | 毎セッションで自動適用 or 手動選択 | ドキュメント品質制御 |
| **Agent (Subagent)** | 特化型のプロンプト＋ツール制限 | メインエージェントが委任時に呼び出す | POC分析を読み取り専用で実行 |
| **Command** | スラッシュコマンドのエントリポイント | ユーザーが `/xxx` で明示的に呼ぶ | `/dge auth` の入口 |
| **Skill** | 複合機能の定義（フロー + テンプレート + ルール） | コマンドやエージェントから参照される | DGE全体のオーケストレーション |

```
ユーザーが /dge auth と入力
  ↓
Command (commands/dge.md) がエントリポイント
  ↓
Skill (skills/dge/SKILL.md) がフロー全体を定義
  ↓
Agent (agents/dge-analyst.md) が verify-poc を担当
  ↓
Output Style (output-styles/dge-writer.md) が文書品質を制御
  ↓
dge-output/auth/ に成果物が出力される
```

---

## 4. DGEイテレーション時の更新フロー

```
DGE実行 (iteration 1)
  ↓
dge-output/{feature}/ に v1 出力
  ↓
人間レビュー → 承認
  ↓
マージスクリプト実行（手動 or 自動）
  ├─ askos-stories/99-reference/ に追記
  ├─ docs/spec-gap-from-stories.md に追記
  ├─ docs/data-model.md に差分反映
  ├─ docs/architecture.md に差分反映
  ├─ docs/api-surface.md に差分反映
  ├─ docs/backlog.md に差分反映
  └─ handover/ に差分反映

DGE実行 (iteration 2 — more_dialogue から)
  ↓
dge-output/{feature}/ に v2 出力（v1は保持）
  ↓
差分のみマージ
```

---

## 5. マージ自動化の構想

現時点ではDGE出力→既存ドキュメントのマージは手動。将来的にはWorkflow Engineの`on_complete`フックで自動マージスクリプトを実行：

```yaml
# dge-workflow-v2.yaml の handover ステップ
- name: handover
  type: terminal
  action: finish
  on_complete:
    record_decision: true
    run_script: "scripts/dge-merge.sh {feature} {dge_output_path}"
```

`scripts/dge-merge.sh` は以下を自動化：
1. use-cases.md の重複チェック＋追記
2. spec-gap-from-stories.md への新セクション追加
3. askos-stories/README.md の索引更新
4. git commit with message "DGE: {feature} — {use_case_count} UCs, {gap_count} gaps"

# DGE Skill — Dialogue Grounding Engineering

## What this skill does

プロジェクトに対してDGE（Dialogue Grounding Engineering）を実行する。
ソースコードを理解した上で会話劇を生成し、usecase / spec / architectureを逆算的に抽出する。

## When to use

- 新機能の設計前
- 既存機能のspec精緻化
- リリース前のgap最終チェック
- 新メンバーのドメイン理解促進

## Usage

```
/dge <target_feature> [options]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--app-type` | `web` | `web \| cli \| library \| infrastructure \| api` |
| `--audience` | `engineer` | `engineer \| junior \| pm` |
| `--patterns` | `zero-state,role-contrast` | カンマ区切りの会話劇パターン指定 |
| `--scope` | `.` | スキャン対象ディレクトリ |
| `--skip-verify` | `false` | verify-pocをスキップ |
| `--previous` | なし | 差分DGE用の前回出力パス |

### Examples

```bash
# 基本: auth機能にDGE
/dge auth

# CLIツールのパーサー機能にDGE
/dge parser --app-type cli

# PMが見る用にジュニアレベルで出力
/dge notification --audience junior

# 前回DGEからの差分
/dge auth --previous dge-output/auth/

# 特定パターンセットで会話劇を生成
/dge cart --patterns before-after,escalation-chain,scale-break

# 巨大プロジェクトでスコープを絞る
/dge auth --scope src/auth/
```

## Execution flow

```
1. verify-poc    ソースコード分析、機能リスト生成
                 (--skip-verify で省略可)
                      ↓
2. generate      指定パターンで会話劇生成
                      ↓
3. validate      hallucination cross-check
                 (実装済み機能リストとの突合)
                      ↓
4. review        会話劇を表示、追加シナリオの要否を確認
                 → 追加要求: 2に戻る (max 3回)
                      ↓
5. extract       gapを構造化抽出
                      ↓
6. generate-spec use-cases.md, spec-implications.md,
                 gap-analysis.md, handover.md を生成
                      ↓
7. output        dge-output/<feature>/ に書き出し
```

## Output structure

```
dge-output/<feature>/
├── dialogue-v1.md              # 会話劇
├── validation-report.md        # hallucination検証結果
├── use-cases.md                # Use Case一覧
├── spec-implications.md        # Spec Implications
├── gap-analysis.md             # Gap分析 (data model, arch, API, priority)
└── handover-to-claude-code.md  # 実装者向けハンドオーバー
```

## Dialogue patterns

### 対比パターン（指定: --patterns）

| ID | Name | Description |
|----|------|-------------|
| `before-after` | Before/After | 導入前/後の対比 |
| `role-contrast` | Role Contrast | 異なるユーザーロールの対比 |
| `app-type-variation` | App-Type Variation | 異なるアプリ種別での適用 |

### 探索パターン

| ID | Name | Description |
|----|------|-------------|
| `zero-state` | Zero-State | 空の状態から使い始める |
| `return-after-absence` | Return After Absence | 長期不在後に戻る |
| `escalation-chain` | Escalation Chain | 問題のエスカレーション |
| `cross-persona-conflict` | Cross-Persona Conflict | ペルソナ間の期待衝突 |
| `migration-path` | Migration Path | 旧バージョンからの移行 |
| `multi-tenant` | Multi-Tenant | 複数テナント間の分離 |

### 限界探索パターン

| ID | Name | Description |
|----|------|-------------|
| `scale-break` | Scale Break | 大量データ/ユーザー |
| `hallucination-probe` | Hallucination Probe | LLM補完の検出 |
| `convergence-test` | Convergence Test | 反復収束の確認 |
| `drift-detection` | Drift Detection | 実装後のspec乖離 |
| `security-adversary` | Security Adversary | 悪意あるユーザーの操作 |
| `accessibility-barrier` | Accessibility Barrier | アクセシビリティの障壁 |

## Integration with AskOS

DGE成果物はAskOSの以下のドキュメントに対応・影響する：

| DGE出力 | AskOS対応ドキュメント | 更新方法 |
|---------|---------------------|----------|
| use-cases.md | askos-stories/99-reference/use-cases.md | マージ追記 |
| spec-implications.md | askos-stories/99-reference/spec-implications.md | マージ追記 |
| gap-analysis.md | docs/spec-gap-from-stories.md | 新セクション追加 |
| handover.md | handover/handover-to-claude-code.md | 差分反映 |
| dialogue-v*.md | askos-stories/<nn>-<category>/ | 新ストーリー追加 |

## Notes

- verify-poc は Read/Grep/Glob のみ使用（書き込みしない）
- generate-dialogue は app_type に応じてプロンプトが自動切り替え
- hallucination check は config.hallucination_check: false で無効化可能
- 出力は全て dge-output/ 配下。既存ファイルは上書きしない（v1, v2でバージョニング）

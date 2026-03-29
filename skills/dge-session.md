# Skill: DGE Session 実行（開発用 — DGE-toolkit リポジトリ内）

## Trigger
ユーザーが以下のいずれかを言ったとき:
- 「DGE して」「会話劇で見直して」「gap を探して」「壁打ちして」「ブレストして」
- 「実装できるまで回して」（→ 自動反復モード）

## MUST ルール（必ず守る）
1. **キャラクター選択はユーザーに確認を得てから進む。**
2. **会話劇の全文を画面に表示し、同時に `design-materials/intake/` に保存する。** 保存は無条件。**（自動反復モード中は画面サマリーのみ、ファイル保存は MUST）**
3. **Gap 一覧テーブルを出力する。** 列: `| # | Gap | Category | Severity |`
4. **サマリー表示後、ユーザーの指示を待つ。（自動反復中は自動で次へ）**
5. **番号付き選択肢を提示する。**
6. **「実装する」→ Critical/High の Spec を `dge/specs/` に生成してから実装。**
7. **Spec ファイルに DGE 生成警告 + `status: draft` を付与。**
8. **DGE は `dge/` および `design-materials/` 内にのみ書き込む。**
9. **自動反復中、各 iteration をファイル保存する。省略不可。**

## SHOULD ルール
1. テンプレート候補 1 つ → 自動選択。2+ → 提示。
2. Gap 詳細は Observe / Suggest / Act。
3. 3-5 Scene。先輩ナレーション。
4. サマリーに全文パス表示。
5. Medium も Spec 化。
6. **verify-poc**: コードがあれば機能一覧を先に作る。
7. **audience**: デフォルト engineer。pm/junior 指定で粒度変更。
8. **hallucination check**: 言及された機能の実在確認。

## 判断ルール

| Step | 条件 | アクション |
|------|------|-----------|
| テーマ | 明確 | 進む |
| テーマ | 曖昧 | 掘り下げ |
| テンプレート | 1 つ | 自動 |
| テンプレート | 2+ | 提示 |
| パターン | 指定なし | テンプレートから自動推奨 |
| パターン | 指定あり | そのまま |
| キャラ | 常に | 確認（例外なし） |
| 実装 vs 深掘り | 仕様が書ける | 「実装する」提案 |
| 実装 vs 深掘り | 未決事項あり | 「DGE を回す」提案 |
| 自動反復 | 「実装できるまで」 | 自動反復モード |
| 自動反復中 | 新規 C/H Gap = 0 | 収束 → Spec 化 |
| 自動反復中 | 5 回到達 | 停止 |

## 手順

### Step 1: DGE Kit 読み込み
method.md, characters/catalog.md, patterns.md を読む。

### Step 2: テーマ確認

### Step 3: テンプレート選択

### Step 3.5: パターン選択
テンプレートに応じたプリセットを推奨:
```
1. 🆕 new-project  2. 🔧 feature-extension  3. 🚀 pre-release
4. 📢 advocacy  5. 🔍 comprehensive  6. カスタム
```

### Step 4: キャラクター提案（応答を待つ）

### Step 5: 会話劇生成（パターンに沿って）

### Step 6: Gap 構造化（Category + Severity）

### Step 7: intake/ に保存

### Step 8: サマリー + 選択肢
```
どうしますか？
1. DGE を回す → 1 回深掘り
2. 実装できるまで回す → 自動反復（最大 5 回）
3. 実装する → Spec 化して実装
4. レビューOK → intake/ から completed/ に移動
5. 後で
```

### Step 9: 判断に従う

| 選択 | アクション |
|------|-----------|
| 1 | Step 2 に戻る |
| 2 | Step 9A（自動反復） |
| 3 | Step 10（Spec 化） |
| 4 | intake/ → dge-sessions/completed/ に移動 |
| 5 | そのまま |

### Step 9A: 自動反復モード
パターン自動ローテーション → 生成 → 保存 → 収束判定。
上限 5 回。追加 +3（hard limit 8）。収束で Step 10 へ。

### Step 10: Spec 化
Critical/High → マッピングに従い Spec 生成 → `dge/specs/` に保存。
```
1. レビューOK → reviewed に更新 → 実装
2. 修正指示
3. 後で
```

## Gap Category → 成果物マッピング

| Gap Category | 主要 | 補助 |
|---|---|---|
| Missing logic | UC + TECH | — |
| Spec-impl mismatch | DQ | ADR |
| Type/coercion gap | TECH | — |
| Error quality | TECH | — |
| Integration gap | TECH | — |
| Test coverage | ACT | — |
| Business gap | ADR / DQ | — |
| Safety gap | TECH + ACT | — |
| Ops gap | ACT | — |
| Message gap | UC | — |
| Legal gap | ADR + ACT | — |

## Spec ヘッダ（MUST）
```yaml
---
status: draft
source_session: [session パス]
source_gap: [Gap 番号]
---
```
```
<!-- DGE 生成: 実装前に人間がレビューしてください。 -->
```

## Spec 種類
UC / TECH / ADR / DQ / ACT（プレフィックス付きファイル名）

## Spec ライフサイクル
`draft → reviewed → migrated`

## Severity 基準
Critical: 実装不能/データ損失 | High: 主要 UC/セキュリティ | Medium: 品質/回避策あり | Low: nice-to-have

## 出力フォーマット
ファイルヘッダ（MUST）: 日付, テーマ, キャラ, **パターン**, テンプレート
Gap テーブル（MUST）: #, Gap, Category, Severity
Gap 詳細（SHOULD）: Observe / Suggest / Act

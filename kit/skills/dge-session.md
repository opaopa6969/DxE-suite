<!-- DGE-toolkit (MIT License) — https://github.com/xxx/DGE-toolkit -->
<!-- 前提条件: プロジェクトルートに dge/ フォルダが存在すること -->

# Skill: DGE Session 実行

## Trigger
ユーザーが以下のいずれかを言ったとき:
- 「DGE して」
- 「会話劇で見直して」
- 「gap を探して」
- 「壁打ちして」
- 「ブレストして」

## 前提条件
- `dge/method.md` が存在すること
- 見つからない場合、session を開始せず以下を案内する:
  「DGE toolkit がインストールされていません。https://github.com/xxx/DGE-toolkit を参照してインストールしてください。」

## MUST ルール（必ず守る）
1. **キャラクター選択はユーザーに提示して確認を得てから進む。** 確認なしで会話劇を生成しない。推奨セットを 1 つ提案し「変更しますか？」と聞く。
2. **会話劇の全文を画面に表示し、同時に markdown ファイルとして保存する。** 画面には全文を出す。保存はユーザーに聞かず無条件で行う。画面表示の直後にファイル保存する。保存先ディレクトリが存在しない場合のみ、(a) 作成する (b) 別の場所を指定する をユーザーに聞く。デフォルトは `dge/sessions/`。
3. **会話劇の後、Gap 一覧テーブルを出力する。** テーブルの列は: `| # | Gap | Category | Severity |`
4. **サマリー表示後、ユーザーの次のアクション指示を待つ。** 勝手に次の session や実装を開始しない。
5. **サマリーの後に選択肢を提示する:** DGE を回す / 実装する / 後で
6. **初回チェック:** CLAUDE.md に DGE の記述があるか確認する。なければ「CLAUDE.md に DGE の記述を追記しますか？（次回から自動で認識されます）」と聞く。Yes なら追記して続行、No ならそのまま続行。
7. **「実装する」を選んだ場合、Critical/High の Gap について Spec ファイルを `dge/specs/` に生成してからでなければ実装に進まない。** Medium 以下は SHOULD。Low は Action Item のみ。
8. **`dge/specs/` に生成する全ファイルの冒頭に DGE 生成警告ヘッダを入れ、`status: draft` のフロントマターを付与する。**
9. **DGE は `dge/` 内にのみ書き込む。プロジェクトの docs/ や既存ファイルを直接変更しない。**（CLAUDE.md への初回追記提案のみ例外）

## SHOULD ルール（推奨）
1. テンプレート候補が 1 つなら自動選択し報告する。2 つ以上ならユーザーに提示する。
2. Gap 詳細は Observe / Suggest / Act の構造で書く。
3. 会話劇は 3-5 Scene で構成する。先輩（ナレーション）で各 Scene の背景を設定する。
4. サマリー表示時に全文ファイルへのパスを表示する。
5. Medium の Gap も Spec 化する（Low は Action Item のみで十分）。

## 判断ルール（auto-decide vs ask）

| Step | 条件 | アクション |
|------|------|-----------|
| テーマ確認 | ユーザーの指示が 1 文で明確 | そのまま進む |
| テーマ確認 | 質問形式 or 曖昧 | 掘り下げて聞く |
| テンプレート選択 | 候補が 1 つ | 自動選択して報告 |
| テンプレート選択 | 候補が 2 つ以上 | ユーザーに提示 |
| キャラクター選択 | 常に | ユーザーに確認（例外なし） |
| 保存先 | 初回 or ディレクトリ不在 | ユーザーに確認 |
| 保存先 | 2 回目以降 and ディレクトリ存在 | 前回と同じ場所に保存 |
| 実装 vs 深掘り | DGE で具体的な実装仕様が書ける状態 | 「実装する」を提案 |
| 実装 vs 深掘り | 未決事項や曖昧な点が残っている | 「DGE を回す」を提案 |

## 手順

### Step 1: 初回チェックと DGE Kit 読み込み
1. `dge/method.md` を読む（なければ前提条件のエラーメッセージ）
2. `dge/characters/catalog.md` を読む
3. `dge/version.txt` があればバージョンを 1 行表示する（例: `DGE toolkit v1.0.0`）。なくても続行
4. CLAUDE.md に DGE の記述があるか確認（MUST ルール 6）

### Step 2: テーマを確認
ユーザーに「何をテーマにしますか？」と確認。
明確なら Step 3 へ。不明確なら掘り下げる。

### Step 3: テンプレートを選択
`dge/templates/` から最も近いテンプレートを選ぶ。
なければ method.md の Scene 構成ガイドに従って即席で作る。

### Step 4: キャラクターを提案
テーマに応じて catalog.md の推奨を提案:
「このテーマには [キャラA] + [キャラB] + [キャラC] を推奨しますが、変更しますか？」
**ユーザーの応答を待つ。**

### Step 5: 会話劇を生成
各 Scene について:
1. 先輩（ナレーション）で技術的背景を設定
2. キャラクターのセリフを生成（prompt を参照）
3. セリフの直後に `→ Gap 発見:` を挿入
4. Scene 末尾に Gap リストをまとめる

「先輩」はキャラクターではなく narrator。
技術的背景を neutral に語り、キャラが議論に入る context を提供する。

### Step 6: Gap を構造化
各 Gap について:
```
Gap: [タイトル]
  Observe: [現状の問題]
  Suggest: [提案]
  Category: [11 カテゴリのいずれか]
  Severity: [Critical/High/Medium/Low]
```

### Step 7: ファイルに保存
session 出力を markdown ファイルとして保存する。
- ファイル名: テーマを kebab-case にしたもの（例: `auth-api-review.md`）
- 保存先: デフォルト `dge/sessions/`（初回にユーザー確認）
- ディレクトリが存在しなければユーザーに確認して作成

### Step 8: サマリーを表示してユーザーの判断を待つ
以下の形式で表示する:

```
## DGE 結果サマリー

**テーマ**: [テーマ]
**Gap 数**: N 件（Critical: X / High: X / Medium: X / Low: X）

| # | Gap | Severity |
|---|-----|----------|
（High 以上を表示、Medium 以下は件数のみ）

**全文**: `[ファイルパス]`

どうしますか？
- **DGE を回す** → この結果をさらに深掘り
- **実装する** → Spec 化してから実装
- **後で** → 保存したまま終了
```

**ユーザーの応答を待つ。勝手に次のアクションに進まない。**

### Step 9: ユーザーの判断に従う

| ユーザーの判断 | アクション |
|---------------|-----------|
| DGE を回す | Step 2 に戻る（テーマ = 前回の Gap や提案） |
| 実装する | **Step 10 へ進む（Spec 化フロー）** |
| 後で | 何もしない。ファイルはそのまま |

### Step 10: Spec 化（「実装する」選択時）

1. Critical/High の Gap を抽出する
2. 各 Gap の Category に応じた成果物を生成する（下記マッピング参照）
3. `dge/specs/` に全ファイルを保存する（status: draft、DGE 生成警告ヘッダ付き）
4. 生成した Spec 一覧を表示する:

```
## Spec 生成完了

以下の Spec を dge/specs/ に生成しました:

| ファイル | 種類 | 元 Gap |
|---------|------|-------|
| UC-xxx.md | Use Case | Gap-1 |
| TECH-xxx.md | Tech Spec | Gap-3 |
| ADR-NNN-xxx.md | ADR | Gap-5 |

Medium の Gap（N 件）は Spec 化していません。必要なら指示してください。

どうしますか？
- **レビューOK** → status を reviewed に更新して実装開始
- **修正指示** → Spec を修正して再表示
- **後で** → draft のまま残す
```

5. **ユーザーの応答を待つ**
6. レビューOK → 全 Spec の status を `reviewed` に自動更新 → 実装開始
7. 修正 → 指示に従い Spec を修正して再表示
8. 後で → draft のまま残す

## Gap Category → 成果物マッピング

| Gap Category | 主要成果物 | 補助 |
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

## Spec ファイルテンプレート

### 共通フロントマター + 警告ヘッダ（MUST）
```yaml
---
status: draft          # draft → reviewed → migrated
source_session: [session ファイルパス]
source_gap: [Gap 番号]
migrated_to:           # migrated の場合のみ記入
---
```
```
<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。
     既存 docs と矛盾する場合、既存 docs が Source of Truth です。 -->
```

### UC-[name].md — Use Case
`# UC-[name]: [タイトル]` → Trigger / Actors / Flow / Exceptions / Acceptance Criteria

### TECH-[name].md — Tech Spec
`# TECH-[name]: [タイトル]` → 変更内容 / API / Data Model / 影響範囲

### ADR-NNN-[name].md — Architecture Decision Record
`# ADR-NNN: [タイトル]` → Context / Options (A, B) / Decision (未決定) / Consequences

### DQ-[name].md — Design Question
`# DQ-[name]: [質問]` → Context / Options / 決定期限

### ACT-[name].md — Action Item
`# ACT-[name]: [やること]` → 内容 / 担当

## Spec ライフサイクル

```
draft → reviewed → migrated
         ↑ 修正     ↓ 正本への転記
         └────┘     migrated_to: [正本パス]
```

- **draft**: DGE が自動生成した状態。未レビュー
- **reviewed**: 人間がレビュー済み。実装可能
- **migrated**: プロジェクトの正式な docs/ に転記済み。このファイルは参照用

## 出力フォーマット仕様

### ファイルヘッダ（MUST）
```markdown
# DGE Session: [テーマ]

- **日付**: YYYY-MM-DD
- **テーマ**: [テーマの 1 行説明]
- **キャラクター**: [使用キャラクター]
- **テンプレート**: [使用テンプレート名] または "カスタム"
```

### Gap 一覧テーブル（MUST）
```markdown
| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 1 | [Gap の 1 行説明] | [Category] | High |
```

### Gap 詳細（SHOULD）
```markdown
### Gap-N: [タイトル]
- **Observe**: [現状の問題]
- **Suggest**: [提案]
- **Act**: [具体的な仕様: UC, API, Data Model 等]
```

## Severity 判断基準

| Severity | 基準 |
|----------|------|
| Critical | これがないと機能が実装不能 / データ損失リスク |
| High | 主要ユースケースに影響 / セキュリティリスク |
| Medium | 品質・UX に影響するが回避策あり |
| Low | 改善レベル / nice-to-have |

## 注意
- 1 Scene は 3-5 キャラの発言で構成
- 1 Session は 3-5 Scene
- 合計 15-30 分が目安
- 会話劇の後、必ずユーザーにレビューしてもらう（会話劇 → レビュー の往復が本質）
- DGE の Spec と既存 docs が矛盾する場合、**既存 docs が Source of Truth**。DGE Spec は提案

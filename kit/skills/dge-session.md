<!-- DGE-toolkit (MIT License) -->

# Skill: DGE Session 実行

## Trigger
- 「DGE して」「会話劇で見直して」「gap を探して」「壁打ちして」「ブレストして」
- 「実装できるまで回して」（→ 自動反復モード）

## 共通 MUST ルール（全 flow で必ず守る。3 個のみ）
1. **会話劇は保存（無条件）。** ユーザーに聞かず保存する。
2. **一覧（Gap/アイデア）を出力する。**
3. **一覧の後に番号付き選択肢を提示する。省略しない。** Gap の修正や実装に直接進まない。「どの Gap から修正しますか？」とは聞かない。

追加の MUST は flow YAML に定義されている。flow YAML がなければ上記 3 個のみ。

## 手順

### Step 0: flow 自動判定

ユーザーの入力から flow を判定する:

```
"DGE して" のみ / 短い指示 → ⚡ quick
テンプレート名言及 / "詳しく" / "本格的に" / "Spec" → 🔍 design-review
"ブレスト" / "アイデア" / "brainstorm" → 💡 brainstorm
キャラ名のみ言及 → quick + キャラ変更
設計ドキュメント添付・参照あり → design-review
```

判定した flow を 1 行表示: `Flow: ⚡ クイック`
`dge/flows/{flow}.yaml` があれば読み込む。なければ下記のデフォルト動作。

### Step 1: Kit 読み込み（全 flow 共通）
1. `dge/method.md` を読む（なければ install 案内）
2. `dge/characters/catalog.md` の **使い分け早見表とテーマ別推奨のみ** を読む（各キャラの prompt は Step 4 で選択後に読む — lazy loading）
3. `dge/custom/characters/*.md` があれば **ファイル名と冒頭の name/icon のみ** 読む（Prompt Core は選択後）
4. `dge/patterns.md` を読む
5. `dge/flows/{判定した flow}.yaml` を読む。**YAML の must_rules, workflow, post_actions, auto_merge を実際に参照して動作を決定する。** YAML がなければ下記のデフォルト動作。
6. `dge/version.txt` があれば 1 行表示
7. **dge-tool 検出**: Bash で `dge-tool version` を実行。
   - 成功 → `🔧 Tool mode (dge-tool vX.X.X)` と表示
   - 失敗 → Skill mode（従来通り）

### Step 2: テーマ確認（全 flow 共通）
明確なら次へ。不明確なら掘り下げる。

### Step 3: テンプレート選択（design-review のみ）
`dge/templates/` から選択。quick / brainstorm ではスキップ。

### Step 3.5: パターン選択（design-review のみ）
プリセットを推奨。quick / brainstorm ではスキップ（自動選択）。

### Step 4: キャラクター提案
- **quick**: 推奨セットを 1 行表示。確認は求めない。
  `キャラ: 今泉 + 千石 + 僕（変更したい場合は指示してください）`
- **design-review / brainstorm**: 推奨セットを提示し確認を待つ。

built-in + カスタムキャラの名前・アイコン一覧を表示（Step 1 で読み込み済み）。

**キャラ確定後、選択された 3-5 名の prompt_core と personality セクションのみ読み込む（lazy loading）。** 19 キャラ全員の prompt を読む必要はない。

### Step 5: 会話劇生成（全 flow 共通）
- flow の extract.marker を使う（デフォルト: `→ Gap 発見:`、brainstorm: `→ アイデア:`）
- 先輩（ナレーション）で背景設定 → キャラ対話 → マーカー挿入
- **auto_merge が true（デフォルト）の場合**: 会話劇生成と同時に、バックグラウンドで isolated subagent を起動して素の LLM レビューを開始する。subagent は `isolation: "worktree"` で DGE の context を持たない。会話劇が終わる頃には素のレビューも完了している。
- auto_merge を OFF にしたい場合: 「マージなしで DGE して」と指示するか、flow YAML で `auto_merge: false` を設定

### Step 6: 構造化（flow による）
- quick / design-review: Gap に Category + Severity を付与
- brainstorm: アイデアに分類を付与（severity なし）

### Step 7: 保存（全 flow 共通、MUST）

**Tool mode**: Bash で実行:
```
echo "<session 全文>" | dge-tool save <output_dir>/<theme>.md
```
→ "SAVED: ..." が返れば成功。失敗したら Write ツールでフォールバック。

**Skill mode**: Write ツールでファイル保存。

flow の output_dir に保存（デフォルト: `dge/sessions/`）。
プロジェクトファイルがあれば更新。

### Step 8: サマリー + 選択肢（全 flow 共通、MUST）

```
## DGE 結果サマリー

**Flow**: [flow 名]
**テーマ**: [テーマ]

### DGE の発見
**Gap 数**: N 件（Critical: X / High: X / Medium: X）

| # | Gap | Severity |
|---|-----|----------|
（主要なものを表示）

### 素の LLM の発見（auto_merge ON の場合）
**Gap 数**: N 件（isolated subagent による独立レビュー）

### マージ結果（auto_merge ON の場合）
| # | Gap | Source | Severity |
|---|-----|--------|----------|
| 1 | ... | DGE のみ | High |
| 2 | ... | 両方 | Critical |
| 3 | ... | 素のみ | Medium |

DGE のみ: N 件（深い洞察） / 素のみ: N 件（網羅的） / 両方: N 件（確実に重要）

**全文**: `[ファイルパス]`
```

auto_merge OFF の場合はマージ結果を省略し、DGE の発見のみ表示。

選択肢は flow YAML の post_actions から表示。デフォルト:
```
1. DGE を回す
2. 実装できるまで回す
3. 実装する
4. 後で
```
auto_merge OFF の場合のみ追加: `5. 素の LLM でも回してマージ`

**ユーザーの応答を待つ。**

### Step 9: ユーザーの判断に従う

flow YAML の post_actions の id に応じて分岐:

| id | アクション |
|----|-----------|
| dge_again | Step 9B（前回コンテキスト + TreeView） |
| auto_iterate | Step 9A（自動反復） |
| implement | Step 10（累積 Spec 化） |
| merge_plain | Step 9C（subagent で素の LLM マージ） |
| switch_full | flow を design-review に切替えて Step 3 から |
| switch_review | flow を design-review に切替え |
| review_ok | output_dir の該当ファイルを completed/ に移動 |
| later | 終了 |

### Step 9A: 自動反復モード
パターン自動ローテーション → 生成 → 保存 → 収束判定。
上限 5 回。+3 追加可能（hard limit 8）。収束で Step 10 へ。
自動反復中: 画面はサマリーのみ、ファイル保存は MUST。

### Step 9B: 前回コンテキスト + プロジェクトナビゲーション
プロジェクトファイルがあれば TreeView 表示。なければ前回サマリー + 3 択。

### Step 9C: 素の LLM マージ（isolated subagent）

**重要: DGE の結果を知らない独立した agent で素のレビューを行う。** これにより DGE の Gap を「補完する」バイアスを排除する。

1. **isolated subagent を起動**: Agent ツールで `isolation: "worktree"` を指定。
   DGE session の context を一切持たない別プロセスが実行する。

   subagent へのプロンプト:
   ```
   以下の設計ドキュメントをレビューしてください。
   問題点、考慮漏れ、矛盾を全て挙げてください。
   各問題に Category と Severity (Critical / High / Medium / Low) をつけてください。
   テーブル形式で出力: | # | Gap | Category | Severity |

   [テーマの設計ドキュメント / コンテキスト]
   ```

   **subagent には DGE の Gap 一覧や会話劇を渡さない。** 完全に独立したレビュー。

2. **素の Gap 一覧を受け取る**

3. **DGE の Gap と素の Gap をマージ**:
   - Gap タイトルの意味的類似度で重複を判定
   - 同じ問題 → 「両方」ラベル（信頼度が高い）
   - DGE のみ → 「DGE のみ」ラベル（深い洞察の可能性）
   - 素のみ → 「素のみ」ラベル（網羅的チェック）

4. **比較表を表示**:
   ```
   ## マージ結果: DGE + 素の LLM（isolated）

   ### 数値比較
   | 指標 | DGE | 素の LLM |
   |------|-----|---------|
   | Gap 総数 | N | N |
   | Critical | N | N |
   | High | N | N |
   | カテゴリ数 | N/11 | N/11 |

   ### Gap 一覧（統合）
   | # | Gap | Source | Severity |
   |---|-----|--------|----------|
   | 1 | [gap] | DGE のみ | High |
   | 2 | [gap] | 両方 | Critical |
   | 3 | [gap] | 素のみ | Medium |

   DGE のみ: N 件（深い洞察）
   素のみ: N 件（網羅的チェック）
   両方: N 件（確実に重要）

   どうしますか？
   1. 実装する → マージ済み Gap から Spec 化
   2. 後で
   ```

5. **素の LLM の生出力を保存**: `dge/sessions/{theme}-plain-raw.md`（再現性の担保）
6. **マージ結果をファイルに保存**: `dge/sessions/{theme}-merged.md`

### Step 10: 累積 Spec 化（design-review のみ）
同テーマの全 session Gap を統合 → Critical/High を Spec 化 → `dge/specs/` に保存。
Spec レビュー: OK → reviewed に更新 / 修正 / 後で。

## Severity 判断基準

| Severity | 基準 |
|----------|------|
| Critical | 機能が実装不能 / データ損失リスク |
| High | 主要ユースケースに影響 / セキュリティリスク |
| Medium | 品質・UX に影響するが回避策あり |
| Low | 改善レベル / nice-to-have |

## 注意
- 1 Scene 3-5 キャラ発言、1 Session 3-5 Scene
- 会話劇 → 人間レビュー の往復が本質
- DGE Spec と既存 docs が矛盾する場合、既存 docs が Source of Truth
- flow YAML がなくても動く（backward compatible）。その場合は quick 相当

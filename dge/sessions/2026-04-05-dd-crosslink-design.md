# DGE Session: セッション↔設計判断(DD)相互リンク

**Date:** 2026-04-05
**Structure:** 🗣 座談会
**Cast:** ☕ ヤン + 👤 今泉 + ⚔ リヴァイ + 🕵 右京 + 🎬 舞台監督
**Rounds:** 3（Quick → C/H Gap 解消 → エッジケース）

## テーマ

DGEセッションと設計判断(DD: Design Decision)を相互リンクする仕組みをDGE-toolkitに標準化する。
propstackプロジェクトで手動実現されたパターン（DD-001〜DD-008 ↔ 6セッション）をベースに、
flow YAML・スキル・テンプレートとして組み込む。

## Round 1: 基本設計

### Scene 1: そもそも何をリンクするのか

先輩: 「propstackプロジェクトでDGEを6セッション回した結果、DD-001〜DD-008という設計判断ドキュメントが生まれた。各DDからセッションへ、セッションからDDへ、手動で相互リンクしている。これをDGE-toolkitの仕組みとして標準化したい。」

👤 今泉: 「そもそも、DDって全部のDGEセッションから生まれるんですか？ 生まれないセッションもあるんじゃ？」

☕ ヤン: 「…当然あるよね。Gap が10個出ても、設計判断として記録に値するのは2〜3個でしょ。Gapの大半は『直せばいい』レベルで、DDにはならない。」

👤 今泉: 「要するに、GapとDDは別物ってことですよね？ Gap = 穴の発見、DD = 穴に対する判断の記録。」

☕ ヤン: *紅茶を啜りながら* 「そう。Gapは『未定義だ』と言ってるだけ。DDは『こう決めた、なぜならこうだから』。DDはGapから生まれることもあるし、Gapなしで生まれることもある——例えば命名の議論とか。propstackのDD-002がまさにそれ。」

→ Gap 発見: **Gap ≠ DD の関係が未定義** — Gap一覧とDD一覧の関係（1:1? N:1? N:M?）が明文化されていない

🕵 右京: 「細かいことが気になるんですよ。propstackのセッションファイルを見ますと、冒頭に `Decision: DD-002` とリンクがある。しかし005のセッションはDD-005とDD-006の**2つ**を生んでいます。つまりセッション:DD = 1:N ですね。逆にDD側からは必ず1セッションを参照している。」

→ Gap 発見: **リンクのカーディナリティが未定義** — Session:DD = 1:N、DD:Session = 1:1 を前提とするなら、それを明記する必要がある

### Scene 2: どこに何を置くか

先輩: 「実装の話に入ろう。DDドキュメントはどこに置くか。propstackでは `docs/design-decisions.md` に全DDをまとめ、セッションは `dge/sessions/` にある。」

⚔ リヴァイ: 「場所は2択だ。`dge/decisions/` か、プロジェクト側の `docs/` か。」

☕ ヤン: 「`dge/decisions/` がいいんじゃない？ セッションが `dge/sessions/` にあるなら、DDも `dge/` の下にあるのが自然でしょ。`docs/` はプロジェクトのドキュメント。DDはDGEプロセスの成果物。」

👤 今泉: 「でも、DDって設計ドキュメントですよね？ DGEを知らない開発者が `docs/` を見て設計判断を探すのは自然じゃないですか？」

☕ ヤン: *少し考えて* 「…まあ、それはプロジェクト側の判断でしょ。ツールキットは `dge/decisions/` をデフォルトにして、flow YAMLで `decisions_dir` をオーバーライドできればいい。propstackみたいに `docs/` に置きたいなら変えればいい。」

⚔ リヴァイ: 「1ファイル1DDか、全部まとめて1ファイルか。」

🕵 右京: 「propstackは1ファイルにDD-001〜DD-008をまとめています。しかしこれは8件だからできること。30件になったら？」

☕ ヤン: 「1DD = 1ファイルが正解。indexファイルに一覧を置く。propstackのは初期の手動運用だから、まとめてただけ。」

→ Gap 発見: **DDの保存形式が未定義** — 1DD=1ファイル + indexファイルの構造を決める必要がある

⚔ リヴァイ: 「ファイル名の規則は `DD-001-naming.md` でいい。連番 + slug。セッションファイルと同じ流儀だ。」

### Scene 3: フローへの組み込み

先輩: 「では、DGEセッションのどのタイミングでDDを作るか。現在のフローはStep 8（サマリー+選択肢）→ Step 9（分岐）で、post_actionsに `dge_again`, `auto_iterate`, `switch_full`, `merge_plain`, `later` がある。」

👤 今泉: 「他にないんですか、タイミング。セッション後だけ？ セッション中にDDが確定することもありません？」

☕ ヤン: 「セッション中は無理。DDは議論の結果を踏まえて人間が判断するもの。会話劇の途中で『DD確定！』はおかしい。post_actionが正しい。」

⚔ リヴァイ: 「post_actionsに `record_decision` を追加。選んだら、DDテンプレートを埋めて `dge/decisions/DD-NNN-slug.md` に保存。セッションファイルにDDリンクを追記。DD側にセッションリンクを書く。以上。」

*リヴァイが腕を組む。*

☕ ヤン: 「…それでほぼ終わりだよね。」

→ Gap 発見: **post_actions に `record_decision` が未定義** — flow YAML の post_actions に設計判断記録アクションがない

🕵 右京: 「ちょっと待ってください。`record_decision` を選ぶとき、どのGapに対する判断なのか。それとも Gapに紐づかないDDもある——Scene 1で話した命名の議論のように。」

☕ ヤン: 「Gapへの紐づけはオプションでいいんじゃない？ `gap_ref:` フィールドを持つけど、空でも有効。」

→ Gap 発見: **DD↔Gap の紐づけルールが未定義** — DDがGapを参照するかはオプショナルだが、その仕様がない

### Scene 4: テンプレートと自動化の程度

先輩: 「DDのテンプレートについて。propstackの実例では、各DDに Session リンク、Decision（一行）、Rationale、候補の比較表がある。」

⚔ リヴァイ: 「テンプレはこれだけでいい。」

☕ ヤン: 「十分。これ以上はover-engineering。」

👤 今泉: 「前もそうだったっけ——propstackでは `Rejected approaches` とか `DGE dialogue summary` みたいに引用が入ってましたよね。あれはテンプレートに入れなくていいんですか？」

☕ ヤン: 「それはユーザーが自由に書く部分。テンプレートは最小限のフィールドだけ持ってればいい。」

⚔ リヴァイ: 「自動化の範囲。DDファイルの生成、DD連番の採番、セッションファイルへの逆リンク追記、indexファイルの更新——この4つをスキルに書けばいい。dge-toolのコマンドまではいらない。」

→ Gap 発見: **DD採番のロジックが未定義** — 既存DDの最大番号+1? ディレクトリをスキャンして決定?

🕵 右京: 「indexファイルなんですが。`dge/decisions/index.md` に一覧を置くとして、セッション側の `dge/sessions/` にもindex的なものはあるんでしょうか。セッション一覧からDDを辿れないと、片方向リンクですよ。」

→ Gap 発見: **セッション側のDD逆リンク表示が未定義** — セッションファイル個別にDDリンクを書くだけでなく、セッション一覧からDDへの参照を辿れる仕組みが必要

*🎬 舞台監督が顔を上げる。*

🎬 舞台監督: 「この議論、ずっと『DGE-toolkitのユーザー』の目線で話しているが、DDを読む人はDGEを知らない開発者かもしれない。DDドキュメントがDGEの語彙に依存しすぎると、外部から読めなくなる。」

*また書き始める。*

→ Gap 発見: **DDドキュメントの読者が未定義** — DDを読むのはDGEユーザーだけか、プロジェクトの全開発者か。語彙・フォーマットの前提が異なる

### Scene 5: skill か YAML か両方か

先輩: 「最後に、実装の着地点。dge-session.md スキルの修正、flow YAML の修正、新スキル作成、DDテンプレート作成——どれが必要か。」

☕ ヤン: 「最小限でいこう。」

1. **flow YAML**: `post_actions` に `record_decision` を追加。全flowに
2. **dge-session.md**: Step 9の分岐に `record_decision` の処理を追記
3. **DDテンプレート**: `kit/templates/decision.md` を1つ置く
4. **新スキルは不要** — セッションの流れの中で完結する

⚔ リヴァイ: 「同意。新スキル作るな。post_actionの1つとして既存フローに入れろ。」

👤 今泉: 「でも、セッションの外で後からDDを追加したくなったらどうするんですか？ 1週間後に『あのセッションのGap-3、やっぱりDDにしたい』って場合。」

☕ ヤン: *ため息* 「…手動でファイル作ればいい。テンプレートがあるんだから。」

⚔ リヴァイ: 「いや、それだと逆リンクの更新を忘れる。」

☕ ヤン: 「…じゃあ、`dge-update.md` スキルの守備範囲にするか。既存のupdateスキルに『DDの追加・リンク修正』を足す。新スキルは作らない。」

→ Gap 発見: **セッション外からのDD作成パスが未定義** — post_action経由でない場合のDD作成と相互リンクの手順

*🎬 舞台監督が最後に顔を上げる。*

🎬 舞台監督: 「一つだけ。この仕組み全体が『DDを書く文化があるプロジェクト』を前提にしている。DDを書かないプロジェクトにとっては、post_actionsに毎回 `record_decision` が出るのはノイズ。opt-inにするか、flow YAMLで消せるようにするか、考えておいたほうがいい。」

→ Gap 発見: **DD機能のopt-in/opt-out が未定義** — DDを使わないプロジェクトで `record_decision` が表示されないようにする仕組みが必要

## Round 1 Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 1 | Gap ≠ DD の関係が未定義 | Spec-impl mismatch | 🟡 Medium |
| 2 | リンクのカーディナリティが未定義 (Session:DD = 1:N, DD:Session = 1:1) | Missing logic | 🟡 Medium |
| 3 | DDの保存形式が未定義 (1DD=1ファイル + index) | Missing logic | 🟠 High |
| 4 | post_actions に `record_decision` が未定義 | Missing logic | 🔴 Critical |
| 5 | DD↔Gap の紐づけルールが未定義 | Missing logic | 🟡 Medium |
| 6 | DD採番のロジックが未定義 | Missing logic | 🟡 Medium |
| 7 | セッション側のDD逆リンク表示が未定義 | Integration gap | 🟠 High |
| 8 | DDドキュメントの読者が未定義 | Message gap | 🟡 Medium |
| 9 | セッション外からのDD作成パスが未定義 | Missing logic | 🟡 Medium |
| 10 | DD機能のopt-in/opt-out が未定義 | Missing logic | 🟠 High |

---

## Round 2: C/H Gap を潰す

### Scene 1: Critical — post_actions の設計

⚔ リヴァイ: 「ユーザーが `record_decision` を選んだときのフロー:」
1. 「どの議論を記録しますか？」→ Gap番号 or 自由記述
2. DDテンプレートを生成（タイトル、Decision一行、Rationale）— 会話劇の内容から自動ドラフト
3. ユーザーに確認 → 保存
4. セッションファイルの冒頭に Decision: リンクを追記
5. index.md を更新
6. Step 8 に戻る（ループルール通り）

複数DDはループで対応（もう一回 `record_decision` を選べばいい）。

→ Gap-4 **解決**

### Scene 2: High — 保存形式とディレクトリ

```
dge/decisions/
├── index.md          # DD一覧（番号・タイトル・セッションリンク）
├── DD-001-naming.md
├── DD-002-why-not-di.md
└── ...
```

flow YAML に `decisions_dir` フィールドを追加してオーバーライド可能に。

→ Gap-3 **解決**

### Scene 3: High — セッション側の逆リンク

セッションファイル冒頭に `**Decisions:**` リストを追記（post_action実行時に自動）。セッション一覧indexは不要。

→ Gap-7 **解決**

### Scene 4: High — opt-in/opt-out

デフォルト true（選択肢に表示するだけ、選ばなければ副作用ゼロ）。`decisions: false` で非表示。ディレクトリは初回DD作成時にlazy creation。

→ Gap-10 **解決**

---

## Round 3: エッジケースと統合

### Scene 1: auto_iterate との衝突

auto_iterate 中は `record_decision` を選択肢に出さない。反復が終わった最終サマリーでのみ表示。

→ Gap-11 **解決**

### Scene 2: i18n

テンプレートのフィールド名は英語固定（Decision, Rationale, Alternatives）。中身はユーザーの言語。display_name は既存の日本語のみ方式を踏襲。

→ Gap-12 **解決**

### Scene 3: DDの陳腐化

DDはステートマシンにしない。方針転換時は新DDが旧DDを supersede する。テンプレートに `Supersedes:` / `Superseded by:` のオプショナルフィールドを追加。`record_decision` 時に既存DD一覧を提示して supersede 確認。

→ Gap-13, Gap-14 **解決**

### Scene 4: DDテンプレート最終形

```markdown
# DD-{NNN}: {title}

**Date:** {YYYY-MM-DD}
**Session:** [{session-name}](../sessions/{session-file}.md)
**Gap:** {Gap-N (optional)}
**Supersedes:** {DD-NNN (optional)}
**Superseded by:** {DD-NNN (optional, added later)}

## Decision

{一行で何を決めたか}

## Rationale

{なぜその判断をしたか。会話劇からの引用も可}

## Alternatives considered

{(optional) 検討した他の候補と却下理由}
```

### Scene 5: 採番・slug

glob `dge/decisions/` → 正規表現 `DD-(\d+)` の最大番号 + 1。slug はタイトルから英語生成、日本語タイトルの場合はユーザー入力。

## 最終 Gap 一覧

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 1 | Gap ≠ DD の関係 | 🟡 M | method.md追記で解決 |
| 2 | カーディナリティ | 🟡 M | テンプレートで暗黙解決 |
| 3 | 保存形式 | 🟠 H | ✅ 確定 |
| 4 | post_actions に record_decision | 🔴 C | ✅ 解決 |
| 5 | DD↔Gap紐づけ | 🟡 M | テンプレートのoptionalフィールド |
| 6 | 採番ロジック | 🟡 M | ✅ 確定 |
| 7 | セッション側の逆リンク | 🟠 H | ✅ 解決 |
| 8 | DDの読者 | 🟡 M | テンプレートが汎用語彙 |
| 9 | セッション外DD作成 | 🟡 M | dge-update追記 |
| 10 | opt-in/opt-out | 🟠 H | ✅ 解決 |
| 11 | auto_iterate中の表示 | 🟡 M | 自動反復中は非表示 |
| 12 | display_name i18n | 🟢 L | 既存方式踏襲 |
| 13 | DD supersede チェーン | 🟡 M | テンプレートにフィールド追加 |
| 14 | supersede確認ステップ | 🟡 M | record_decision手順に含む |

**C/H Gap: 0件。全件解決済み。**

## 実装タスク

| # | タスク | ファイル |
|---|--------|---------|
| 1 | DDテンプレート作成 | `kit/templates/decision.md` (新規) |
| 2 | 全 flow YAML に `decisions: true` + `record_decision` post_action 追加 | `kit/flows/*.yaml` (8ファイル) |
| 3 | dge-session.md Step 9 に `record_decision` 分岐 + auto_iterate非表示ルール | `kit/skills/dge-session.md` + `.claude/skills/dge-session.md` |
| 4 | dge-update.md にDD追加・リンク修正・supersede手順を追記 | `kit/skills/dge-update.md` + `.claude/skills/dge-update.md` |
| 5 | method.md に Gap vs DD の関係を追記 | `kit/method.md` |

# DGE Session: DGE toolkit のインストール・設定機構の改良

- **日付**: 2026-03-29
- **テーマ**: AskOS の CLAUDE.md / rules / skills パターンを参考に、DGE toolkit のインストール・設定機構を改良する
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル
- **テンプレート**: feature-planning.md ベース（Scene 2 差し替え）
- **前提**: 前回の DGE session（install-mechanism.md）で発見された Gap を踏まえ、AskOS のパターンとの差分から改良点を探る

---

## Scene 1: ユーザーストーリー — 「誰がどうインストールするのか」

**先輩（ナレーション）**:
DGE toolkit は markdown ファイルの集合で、コードは一切ない。MIT ライセンス。現状は `cp -r` でコピーして `skills/*.md` を `.claude/skills/` に置く手順。AskOS は `.claude/CLAUDE.md` を起点に rules/, skills/, profiles/ を読む bootstrap パターンを持つ。DGE toolkit にこのパターンを取り込むか、改良するかが論点。

**👤 今泉**: 「そもそも、DGE toolkit をインストールする人って誰なんですか？ AskOS は自分のプロジェクトだから CLAUDE.md を自分で書いた。でも DGE toolkit は "他人が使う" ものですよね。他人のプロジェクトに CLAUDE.md を追記するのって、どこまで許されるんですか？」

→ **Gap 発見**: インストール先に既存の CLAUDE.md がある場合の共存ルールが未定義。上書きするのか、追記するのか、別ファイルにするのか。

**🎩 千石**: 「既存の CLAUDE.md を壊すなど、お客様への侮辱です。AskOS の CLAUDE.md は 252 行もある。そこに DGE の記述を混ぜたら、オーナーが自分の CLAUDE.md を管理できなくなります。」

**☕ ヤン**: 「要らなくない？ CLAUDE.md に書くのは。Claude Code の skills って `.claude/skills/` に .md 置くだけで自動発動するんでしょ？ だったら CLAUDE.md に何も書かなくていい。skill ファイルの中に "method.md を読め" って書いてあるんだから。」

→ **Gap 発見**: CLAUDE.md への追記が本当に必要か再検証が必要。skills/ の自動発動だけで十分な可能性。

**⚖ ソウル**: 「Let's just say I know a guy... CLAUDE.md に書くか書かないか以前に、ライセンス表示の問題がある。MIT ライセンスでコピーされたファイルには著作権表示を保持する義務がある。install で配布されるファイルに LICENSE 情報が含まれていなければ、ユーザーが無自覚にライセンス違反する可能性がある。」

→ **Gap 発見**: コピー配布される最小セットにライセンス情報が含まれていない。

---

## Scene 2: AskOS パターンとの差分 — 「何を取り込み、何を捨てるか」

**先輩（ナレーション）**:
AskOS の構成を整理する。(1) CLAUDE.md: bootstrap + profile/phase 選択。(2) rules/: autonomous-behavior（勝手にやること）、development-workflow（7フェーズ）、decision-rules（聞く/聞かない）。(3) skills/: 10 以上の skill ファイル。(4) profiles/: 開発スタイルの切替。DGE toolkit は「メソッドキット」であり、SaaS プロダクトではない。全部取り込む必要はない。

**☕ ヤン**: 「profiles と phases は要らない。あれは AskOS がフルスタック開発ツールだから必要。DGE はメソッドだけ。autonomous-behavior も要らない。DGE に "勝手にやること" はない。全部ユーザーが起動する。」

**👤 今泉**: 「要するに、AskOS から取り込むべきものって何なんですか？ 3 つの rules ファイルのうち、DGE に関係あるのはどれですか？」

**🎩 千石**: 「decision-rules です。DGE session のどこでユーザーに聞くか、どこで勝手に進めていいか。今の skill には "ユーザーの応答を待つ" とだけ書いてあるが、何を聞いていいか/聞くべきかの判断基準がない。AskOS の decision-rules は美しい設計です。」

→ **Gap 発見**: DGE session 中の判断ルール（auto-decide vs ask-human）が未定義。テンプレート選択は勝手にやっていいが、キャラ選択は聞くべき、など。

**☕ ヤン**: 「でも rules/ ディレクトリを作るほどの量はないでしょ。DGE の rules は 1 ファイルで済む。AskOS は 3 ファイルに分けてるけど、DGE は skill ファイルの中に書けばいい。ファイル数を増やすな。」

**👤 今泉**: 「他にないの？ AskOS の development-workflow は 7 フェーズあるけど、DGE のワークフローは intake → review → move の 3 ステップ。これは STRUCTURE.md に書いてある。でも skill がこの STRUCTURE.md を読んでるかというと、読んでない。」

→ **Gap 発見**: skill が STRUCTURE.md のワークフローを参照していない。intake ルールが skill 定義から切り離されている。

**⚖ ソウル**: 「AskOS の autonomous-behavior に 1 つだけ盗むべきものがある。"MUST rules" と "SHOULD rules" の区別。DGE でも "必ず守るルール"（intake に置く、レビューを待つ）と "推奨ルール"（Gap を Spec フォーマットに落とす）を分けるべきだ。これは契約書の "shall" と "should" の区別と同じ。法的にも重要。」

→ **Gap 発見**: DGE ルールの強制度（MUST / SHOULD）が未分類。全部同じ重みに見える。

---

## Scene 3: 技術的制約 — 「install の実装」

**先輩（ナレーション）**:
実装の選択肢を整理する。(A) skill ファイルに全ルールを内包する（self-contained）。(B) CLAUDE.md テンプレート + skill + rules を別々に提供する（AskOS 型）。(C) skill が method.md と STRUCTURE.md を読む指示だけ持ち、ルールはそこに書く（ポインタ型）。install のシンプルさと運用の堅牢性のトレードオフ。

**☕ ヤン**: 「(A) にしない？ skill ファイル 1 つコピーしたら全部動く。これが最もシンプル。AskOS は CLAUDE.md + rules/ + skills/ で 3 箇所に分散してるけど、あれはプロダクト開発だから必要な複雑さ。DGE はメソッドkit なんだから、1 ファイル完結が正義。」

**🎩 千石**: 「(A) は美しくありません。skill ファイルが 200 行になったら読めない。method.md にメソッドが書いてある。STRUCTURE.md にワークフローが書いてある。skill は "どの順で何を読んで何をするか" だけ書くべき。内容の重複はお客様を混乱させます。」

**👤 今泉**: 「そもそも、install で何ファイルコピーするんですか？ 今の提案だと skill 2 つ + method.md + characters/ + templates/ + STRUCTURE.md... 結局 10 ファイル以上になりません？」

→ **Gap 発見**: 「シンプルな install」と「正しい分離」が矛盾する。ファイル数を減らすと skill が肥大化し、分離すると install が複雑化する。

**⚖ ソウル**: 「ここで発想を変えよう。DGE toolkit は "配布物" と "install 先に作るもの" を分けるべきだ。配布物は `dge/` にコピーする。install 先に作るのは `.claude/skills/dge-session.md` の 1 つだけ。この skill ファイルが `dge/method.md` と `dge/characters/catalog.md` を参照する。CLAUDE.md には触らない。」

**☕ ヤン**: 「それだ。install は 2 ステップ: (1) `dge/` をコピー (2) `skill` を `.claude/skills/` にコピー。以上。CLAUDE.md は触らない。rules は skill の中に書く。」

**🎩 千石**: 「ただし、skill が参照する `dge/` のパスは install 先によって変わる可能性がある。monorepo で `packages/frontend/dge/` に置いた場合はどうするのですか？」

→ **Gap 発見**: skill 内の `dge/` パス参照がハードコードされている。install 先のディレクトリ構造によって壊れる。

**👤 今泉**: 「前もそうだったっけ？ AskOS の skill は `docs/` とか `stories/` とか相対パスで参照してるけど、あれは CLAUDE.md と同じリポジトリだから動く。DGE の skill は外部から持ち込むものだから、パスの前提が違う。」

→ **Gap 発見**: 外部 kit の skill が host project の構造を仮定する問題。AskOS の skill は自プロジェクト前提で書かれているが、DGE は "持ち込まれる側" という違い。

---

## Scene 4: MVP Scope — 「最小限何を作るか」

**先輩（ナレーション）**:
ここまでの議論から、install 機構の設計空間が明確になった。現実的な制約: (1) メンテナは少人数、(2) ユーザーは主に Claude Code ユーザー、(3) markdown のみでコードなし、(4) 他人のプロジェクトに入り込むツール。

**☕ ヤン**: 「MVP。3 つだけやる。(1) kit/ を作って配布物を分離する。(2) skill を self-contained 寄りに改良して、MUST/SHOULD を明記する。(3) install.sh を 10 行で書く。パスは `dge/` 固定。monorepo 対応は v2。紅茶ください。」

**🎩 千石**: 「パスが固定でも、skill の冒頭に "このファイルは dge/ フォルダがプロジェクトルートにある前提です。異なる場合はパスを書き換えてください" と書くべきです。1 行の注記で防げる混乱を放置するのは怠慢です。」

**⚖ ソウル**: 「install.sh にはライセンス確認を入れろ。`echo "MIT License. See dge/LICENSE for details."` の 1 行でいい。あと skill ファイルに copyright header を入れておけ。"Portions of this file are from DGE-toolkit (MIT)" と。これで配布先のユーザーも守れる。」

→ **Gap 発見**: install.sh がライセンス表示を含むべき。

**👤 今泉**: 「全部必要ですか？ 半分でいいんじゃ？ そもそも install.sh って必要ですか？ README に "cp -r kit/ your-project/dge/ && cp kit/skills/*.md your-project/.claude/skills/" って書けば 1 行で終わりません？」

**☕ ヤン**: 「正しい。install.sh はメンテコスト。README の 2 行のほうがいい。壊れないし。」

**⚖ ソウル**: 「だったら README のその 2 行の後に "DGE-toolkit is MIT licensed. Keep dge/LICENSE in your project." と書け。install.sh を作らないなら、ドキュメントがライセンス義務の最後の砦だ。」

**🎩 千石**: 「最後に 1 つ。skill が STRUCTURE.md の intake ルールを知らないと、また直接 dge-sessions/ に保存する事故が起きます。skill の Step 7 に "STRUCTURE.md の intake ルールに従う" ではなく、ルール自体を skill 内に書くべきです。参照先が別ファイルだと読み飛ばされる。MUST ルールは skill に直接書く。これが品質です。」

→ **Gap 発見**: MUST ルール（intake に置く等）は参照ではなく skill 本体に直接記述すべき。参照だと守られない。

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 1 | 既存 CLAUDE.md との共存ルール未定義 | Integration gap | Medium |
| 2 | CLAUDE.md 追記の必要性が未検証（skills 自動発動で十分かも） | Missing logic | **High** |
| 3 | 配布最小セットにライセンス情報がない | Legal gap | **High** |
| 4 | DGE session 中の判断ルール（auto-decide vs ask-human）未定義 | Missing logic | **High** |
| 5 | skill が STRUCTURE.md のワークフローを参照していない | Spec-impl mismatch | **High** |
| 6 | ルールの強制度（MUST / SHOULD）が未分類 | Message gap | Medium |
| 7 | 「シンプルな install」vs「正しい分離」の矛盾 | Missing logic | Medium |
| 8 | skill 内の dge/ パス参照がハードコード | Integration gap | Medium |
| 9 | 外部 kit の skill が host project の構造を仮定する問題 | Integration gap | Medium |
| 10 | install.sh のライセンス表示 | Legal gap | Low |
| 11 | MUST ルールは参照でなく skill 本体に直接記述すべき | Error quality | **High** |

---

## Gap 詳細（High のみ）

### Gap-2: CLAUDE.md 追記は不要かもしれない
- **Observe**: Claude Code は `.claude/skills/` に置いた .md を trigger phrase で自動発動する。CLAUDE.md にポインタを書く必要がないかもしれない
- **Suggest**: CLAUDE.md への追記を install 手順から削除。skill の自動発動に頼る
- **Act**: install 手順を `cp dge/ → cp skills/ .claude/skills/` の 2 ステップのみにする

### Gap-3: ライセンス情報の配布
- **Observe**: kit/ をコピーした先に LICENSE ファイルがない場合、MIT の著作権表示義務を満たせない
- **Suggest**: kit/ に LICENSE を含める。skill ファイルに copyright header を追加
- **Act**: `kit/LICENSE` を作成。skill 冒頭に `<!-- DGE-toolkit (MIT) — https://github.com/xxx/DGE-toolkit -->` を追加

### Gap-4: DGE session 中の判断ルール
- **Observe**: テンプレート選択は勝手にやるが、キャラ選択はユーザーに聞く、intake に置くのは必須、等の判断基準が暗黙的
- **Suggest**: AskOS の decision-rules パターンを参考に、MUST/SHOULD で skill 内に明記
- **Act**: skill に以下を追加:
```
## MUST（必ず守る）
- キャラクター選択はユーザーに確認してから進む
- 出力は design-materials/intake/ に保存（既存ドキュメントに触れない）
- サマリー表示後、ユーザーの判断を待つ（勝手に次へ進まない）

## SHOULD（推奨）
- テンプレートが近いものがあれば使う（なければ即席で作ってよい）
- Gap を Observe/Suggest/Act フォーマットで構造化する
- 1 session 3-5 scene に収める
```

### Gap-5: skill が STRUCTURE.md を参照していない
- **Observe**: intake ルールは STRUCTURE.md に定義されているが、skill はそれを読む指示がない。結果、前回のように直接 dge-sessions/ に保存する事故が起きた
- **Suggest**: Gap-11 と合わせ、intake ルールを skill 本体に MUST として直接記述する
- **Act**: skill の Step 7 を改良し、ルール自体を skill 内に書く

### Gap-11: MUST ルールは skill に直接記述
- **Observe**: 「STRUCTURE.md を読め」という参照型だと、実際には読み飛ばされる。前回の事故で実証済み
- **Suggest**: MUST レベルのルールは skill ファイル自体に記述。SHOULD は参照でよい
- **Act**: intake ルール、ユーザー確認ポイント、ライセンス表示を skill 内に直接書く

---

## Next Actions

- [ ] Gap-2: CLAUDE.md 不要の方針を確定し、install 手順を `cp dge/ + cp skills/` の 2 ステップに簡素化
- [ ] Gap-3: kit/ に LICENSE を追加、skill に copyright header を追加
- [ ] Gap-4, 5, 11: skill を改良 — MUST/SHOULD ルールを直接記述、intake ルールを内包
- [ ] Gap-6: 全ルールに MUST/SHOULD ラベルを付与
- [ ] Gap-8, 9: skill 冒頭にパス前提の注記を追加（monorepo 対応は v2）

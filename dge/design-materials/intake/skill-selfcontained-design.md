# DGE Session: skill の self-contained 設計と MUST/SHOULD の具体化

- **日付**: 2026-03-29
- **テーマ**: 前回 Gap の深掘り — skill をどこまで self-contained にするか、MUST/SHOULD の具体的な中身
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル
- **テンプレート**: feature-planning.md ベース
- **前提**: install-config-improvement.md の Gap 2, 4, 5, 11 を起点とする

---

## Scene 1: skill の self-contained 設計 — 「1 ファイルにどこまで入れるか」

**先輩（ナレーション）**:
前回の議論で「MUST ルールは skill 本体に直接書くべき」「SHOULD は参照でよい」という方針が出た。現在の dge-session.md は 100 行。method.md は 326 行、characters/catalog.md は 155 行。全部 skill に入れると 500 行超になる。一方、参照だけにすると前回のように読み飛ばされる。どこで線を引くか。

**👤 今泉**: 「そもそも、skill ファイルって誰が読むんですか？ 人間ですか？ LLM ですか？」

**☕ ヤン**: 「LLM。Claude Code が trigger で skill を読んで実行する。人間は skill ファイルを直接読まない。README を読む。」

**👤 今泉**: 「要するに、skill は LLM への指示書で、README は人間への指示書。だったら skill が長くても問題ないんじゃないですか？ LLM は 500 行くらい余裕で読める。」

→ **Gap 発見**: skill の読者が LLM であることを前提とした設計がされていない。人間向けの「読みやすさ」と LLM 向けの「指示の完全性」は異なる最適化。

**🎩 千石**: 「LLM が読むからこそ問題があります。skill が 500 行になると、LLM のコンテキストウィンドウを圧迫します。DGE session 自体が長い出力を生む。skill + method + characters + session 出力で数千行になる。skill は短く、必要なときに必要なファイルを読む設計にすべきです。」

**☕ ヤン**: 「じゃあこうしよう。skill には "何をするか" と "MUST ルール" だけ書く。"どうやるか"（メソッドの詳細）は method.md を読ませる。"誰を使うか"（キャラの詳細）は catalog.md を読ませる。skill は指揮者、method と catalog は楽譜。」

→ **Gap 発見**: skill の責務が不明確。「手順 + ルール + 出力フォーマット」を全部持つのか、「手順 + ルール」だけ持ち「出力フォーマット」は method.md に委譲するのか。

**⚖ ソウル**: 「責務を分けるなら契約として明確にしろ。skill が "Step 1: method.md を読め" と書いてあるのに method.md が存在しなかったらどうなる？ install で `dge/` のコピーを忘れたケースだ。skill に "前提条件: dge/ フォルダが存在すること。なければユーザーに install 手順を案内する" と書け。」

→ **Gap 発見**: skill の前提条件（preconditions）が未定義。dge/ フォルダがない場合のフォールバックがない。

---

## Scene 2: MUST/SHOULD の具体的な中身 — 「何が MUST で何が SHOULD か」

**先輩（ナレーション）**:
AskOS の decision-rules は 3 段階: "Just do it"（聞かない）、"Must ask"（必ず聞く）、"Ask if uncertain"（迷ったら聞く）。DGE session の全ステップについてこの 3 段階を定義する必要がある。現在の skill は Step 4 と Step 8 で「ユーザーの応答を待つ」とだけ書いてある。

**👤 今泉**: 「全ステップについて整理しましょう。Step 1 の "method.md を読む" は勝手にやっていい。Step 2 の "テーマ確認" はユーザーに聞く。Step 3 のテンプレート選択は... どっちですか？」

**☕ ヤン**: 「テンプレート選択は勝手にやっていい。5 つしかないんだから外れても大した問題じゃない。キャラ選択は聞け。キャラが変わると session の質が根本的に変わる。」

**🎩 千石**: 「待ってください。テーマが不明確なときに勝手にテンプレートを選ぶのは危険です。"feature-planning と api-design のどちらにも当てはまる" ケースは多い。テンプレート選択も提案して確認すべきです。ただし、明らかに 1 つしか当てはまらない場合は勝手に進めてよい。」

→ **Gap 発見**: 「明らかな場合は勝手に進める / 曖昧な場合は聞く」の判断基準が "明らか" の定義に依存していて曖昧。

**⚖ ソウル**: 「法的文書の書き方を教えてやる。"明らか" なんて主観的な言葉を使うな。条件を具体的に書け。"テンプレート候補が 1 つの場合は自動選択、2 つ以上の場合はユーザーに提示" — これなら解釈のブレがない。」

→ **Gap 発見**: ルールの記述が「明らか」「適切」等の主観的表現に頼っている。LLM が解釈できる客観的条件にすべき。

**👤 今泉**: 「じゃあ全部整理しましょう。各 Step で "聞く条件" と "勝手に進める条件" を具体的に。」

**🎩 千石**: 「出力フォーマットも MUST にすべきです。前回の session（install-mechanism.md）はサマリーテーブルの形式が曖昧でした。Gap 一覧のテーブル形式、Severity の 4 段階、Observe/Suggest/Act の構造 — これは全て MUST です。形式がバラバラだと後から比較・集計できません。」

→ **Gap 発見**: 出力フォーマットの MUST レベルの仕様が未定義。Gap テーブルの列定義、Severity の定義、Gap 詳細の構造が skill に明記されていない。

**☕ ヤン**: 「フォーマットを MUST にするのはいいけど、ガチガチに固めすぎるとテーマによって使いにくくなる。"Gap 一覧テーブルは MUST、Gap 詳細の内部構造は SHOULD" でいいんじゃない？ テーブルがあれば最低限の一覧性は確保できる。」

---

## Scene 3: install フロー — 「2 ステップで何が起きるか」

**先輩（ナレーション）**:
前回の結論は「cp dge/ + cp skills/ .claude/skills/ の 2 ステップ、CLAUDE.md は触らない」だった。これを具体化する。install 後に何が起きるか。ユーザーが Claude Code で「DGE して」と言う。skill が発動する。method.md を読む。テーマを聞く。session を回す。保存する。この全フローを通しで検証する。

**👤 今泉**: 「そもそも、install した直後に design-materials/ ディレクトリってあるんですか？ dge/ をコピーしただけで design-materials/intake/ は存在しませんよね？」

→ **Gap 発見**: install 時に出力先ディレクトリが作られない。session 出力の保存先が存在しない。

**☕ ヤン**: 「design-materials/ は DGE toolkit の中の話じゃなくて、host project 側の話でしょ。install 先のプロジェクトに design-materials/ を作るのか？ それとも dge/ の中に output/ を作るのか？」

**🎩 千石**: 「これは根本的な問題です。STRUCTURE.md は DGE-toolkit リポジトリの構造を定義しているのであって、install 先の構造を定義していない。skill が "design-materials/intake/ に保存" と言っても、install 先にその場所がなければエラーです。」

→ **Gap 発見**: STRUCTURE.md の intake ワークフローが DGE-toolkit リポジトリ専用になっている。install 先のプロジェクトでの出力先ポリシーが未定義。

**⚖ ソウル**: 「2 つの世界を分けろ。"DGE-toolkit リポジトリ" と "DGE を install したプロジェクト" は別の世界だ。STRUCTURE.md は前者の話。install 先では、出力先はプロジェクトの流儀に従うべきだ。skill には "出力先をユーザーに聞く、デフォルトは dge/sessions/" と書け。」

**👤 今泉**: 「要するに、今の skill は DGE-toolkit リポジトリの中で動くことを前提に書かれていて、install 先で動くことを想定していないんですね。」

→ **Gap 発見**: skill が「DGE-toolkit リポジトリ内で動く」前提で書かれている。install 先で動く skill と開発用の skill が同一ファイル。

**☕ ヤン**: 「ここが核心だ。skill を 2 種類作るべき。(1) kit/skills/dge-session.md — install 先で動く skill。出力先は柔軟。design-materials/ を前提としない。(2) skills/dge-session.md — DGE-toolkit リポジトリ内で動く skill（自分自身を DGE する用）。intake/ 前提。」

→ **Gap 発見**: 配布用 skill と開発用 skill が分離されていない。

**🎩 千石**: 「配布用 skill には "初回実行時の案内" も必要です。install 直後にユーザーが "DGE して" と言ったとき、"DGE toolkit が見つかりました。初めてですか？ 簡単に説明しましょうか？" と聞ける仕組みがあるべきです。AskOS の bootstrap はまさにそれをやっている。」

→ **Gap 発見**: 配布用 skill に初回ユーザー向けのオンボーディングがない。

---

## Scene 4: MVP の再定義 — 「結局何を作るか」

**先輩（ナレーション）**:
3 回の DGE session を通じて、設計空間が大きく広がった。Gap は累計 20 件超。ここで MVP を再定義する必要がある。メンテナは少人数、toolkit は markdown のみ。過剰設計は toolkit 自身の敵。

**☕ ヤン**: 「全部聞いた上で言う。やることは 4 つだけ。

1. **kit/ を作る** — 配布用ファイルだけ入れる。LICENSE 含む。
2. **kit/skills/dge-session.md を書き直す** — install 先で動く前提。MUST ルールを直接記述。出力先はデフォルト `dge/sessions/` で初回に確認。
3. **README を書き直す** — install 手順 2 行 + ライセンス表示。
4. **開発用 skill はこのリポジトリの skills/ にそのまま残す** — intake ルール付き。

以上。rules/ ディレクトリは作らない。CLAUDE.md テンプレートも作らない。紅茶ください。」

**🎩 千石**: 「配布用 skill に入れるべき MUST は以下です:

- キャラクター選択はユーザー確認後に進む
- テンプレート候補が 2 つ以上なら提示して選ばせる
- session 出力はファイルに保存する（保存先は初回に確認、デフォルト `dge/sessions/`）
- サマリー + 全文リンクを表示し、ユーザーの判断を待つ
- Gap 一覧テーブル（#, Gap, Category, Severity）は必ず出力する

SHOULD は:

- Gap 詳細を Observe/Suggest/Act で構造化する
- 1 session 3-5 scene
- 先輩ナレーションで背景を設定する
- テンプレートが近いものがあれば使う」

**⚖ ソウル**: 「配布用 skill の冒頭に以下を入れろ:

```
<!-- DGE-toolkit (MIT License) — https://github.com/xxx/DGE-toolkit -->
<!-- 前提条件: プロジェクトルートに dge/ フォルダが存在すること -->
```

あと kit/LICENSE は必須。README の install 手順の直後に "Keep dge/LICENSE in your project." の 1 行。これで最低限の法的保護は成立する。」

**👤 今泉**: 「要するに、成果物は 4 つ:
1. `kit/` ディレクトリ（配布物）
2. `kit/skills/dge-session.md`（配布用 skill、書き直し）
3. `kit/LICENSE`
4. README の install セクション書き直し

で、今の `skills/dge-session.md` は DGE-toolkit リポジトリの開発用としてそのまま残す。合ってますか？」

**☕ ヤン**: 「合ってる。あと kit/skills/dge-template-create.md も配布用に調整する必要があるけど、それは v2 でいい。まず dge-session.md だけ。」

---

## Gap 一覧（本 session 分）

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 12 | skill の読者が LLM であることを前提とした設計がない | Missing logic | Medium |
| 13 | skill の責務（手順+ルール vs メソッド詳細）が不明確 | Spec-impl mismatch | Medium |
| 14 | skill の前提条件（dge/ の存在）とフォールバックが未定義 | Missing logic | **High** |
| 15 | 判断ルールの記述が主観的表現に頼っている | Error quality | **High** |
| 16 | 出力フォーマットの MUST 仕様が未定義 | Spec-impl mismatch | **High** |
| 17 | install 時に出力先ディレクトリが作られない | Missing logic | **High** |
| 18 | STRUCTURE.md の intake ルールが toolkit リポジトリ専用 | Spec-impl mismatch | **High** |
| 19 | 配布用 skill と開発用 skill が未分離 | Missing logic | **Critical** |
| 20 | 配布用 skill に初回オンボーディングがない | Message gap | Medium |

---

## Gap 詳細（Critical + High）

### Gap-19 [Critical]: 配布用 skill と開発用 skill の分離
- **Observe**: 現在の skills/dge-session.md は DGE-toolkit リポジトリ内での動作を前提としている（intake/ への保存等）。install 先で動かすと、存在しないディレクトリへの保存を指示してしまう
- **Suggest**: kit/skills/dge-session.md（配布用）と skills/dge-session.md（開発用）を分離
- **Act**:
  - `kit/skills/dge-session.md` — install 先前提。出力先は `dge/sessions/`（初回に確認）
  - `skills/dge-session.md` — DGE-toolkit リポジトリ前提。出力先は `design-materials/intake/`

### Gap-14: skill の前提条件とフォールバック
- **Observe**: dge/ フォルダが存在しない場合（install 忘れ等）、skill は method.md を読めず黙って失敗する
- **Suggest**: skill 冒頭に precondition チェックを追加
- **Act**: `Step 1 で dge/method.md が見つからない場合、ユーザーに "DGE toolkit がインストールされていません。https://... からインストールしてください" と案内する`

### Gap-15: 判断ルールの客観的条件化
- **Observe**: 「明らかな場合は自動、曖昧なら聞く」は LLM が一貫して解釈できない
- **Suggest**: 数値・条件で判断基準を書く
- **Act**:
  - テンプレート候補 1 つ → 自動選択、2 つ以上 → ユーザーに提示
  - テーマが 1 文で明確 → Step 3 へ、質問形式 or 曖昧 → 掘り下げ
  - キャラクター → 常にユーザー確認（例外なし）

### Gap-16: 出力フォーマット MUST 仕様
- **Observe**: session ごとに Gap テーブルの形式、Severity 基準、詳細構造がバラつく
- **Suggest**: MUST フォーマットを定義
- **Act**:
```
MUST:
- Gap 一覧テーブル: | # | Gap | Category | Severity |
- Severity: Critical / High / Medium / Low
- ファイルヘッダ: 日付、テーマ、キャラクター、テンプレート

SHOULD:
- Gap 詳細: Observe / Suggest / Act
- Scene 構成の記載
- Next Actions チェックリスト
```

### Gap-17: install 時の出力先ディレクトリ
- **Observe**: install で dge/ をコピーしただけでは session 出力先がない
- **Suggest**: 配布用 skill が初回実行時にデフォルト出力先を提案し、なければ作成する
- **Act**: `dge/sessions/` をデフォルトとし、初回実行時に「session の出力先は dge/sessions/ でいいですか？」と確認

### Gap-18: STRUCTURE.md が toolkit リポジトリ専用
- **Observe**: intake → review → move のワークフローは DGE-toolkit リポジトリ固有。install 先には適用できない
- **Suggest**: 配布用 skill は intake ワークフローを前提としない。シンプルに「保存 → サマリー表示 → ユーザー判断」のみ
- **Act**: 配布用 skill のワークフローを簡素化。`dge/sessions/` に保存して終わり。intake → move の管理は host project の流儀に委ねる

---

## 累計 Gap サマリー（3 sessions 分）

| Session | Gap 数 | Critical | High | Medium | Low |
|---------|--------|----------|------|--------|-----|
| #1 install-mechanism | 11 | 0 | 5 | 4 | 2 |
| #2 install-config-improvement | 11 | 0 | 5 | 4 | 2 |
| #3 本 session | 9 | 1 | 5 | 3 | 0 |
| **重複排除後** | **~22** | **1** | **~10** | **~8** | **~3** |

---

## MVP 成果物（3 sessions の結論）

| # | 成果物 | 対応 Gap |
|---|--------|---------|
| 1 | `kit/` ディレクトリ作成（配布物分離） | #1, #2 |
| 2 | `kit/skills/dge-session.md` 新規作成（配布用） | #4, #5, #11, #14-19 |
| 3 | `kit/LICENSE` 追加 | #3 |
| 4 | README install セクション書き直し | #2, #3, #7 |
| 5 | `skills/dge-session.md` は開発用として維持 | #19 |

## Next Actions

- [ ] kit/ ディレクトリを作成し配布物を格納
- [ ] kit/skills/dge-session.md を新規作成（MUST/SHOULD ルール、客観的判断条件、出力フォーマット仕様を内包）
- [ ] kit/LICENSE を作成
- [ ] README の install セクションを書き直し（2 行 + ライセンス表示）
- [ ] skills/dge-session.md を開発用として整理（intake ルール維持）

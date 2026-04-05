# DGE Session: DGE toolkit の npm update 自動化と migration 機構

- **日付**: 2026-03-29
- **テーマ**: skill による npm update 検知・自動アップデート・ファイル構成変更時の migration 機構
- **キャラクター**: 今泉 + ヤン + 僕 + ソウル
- **テンプレート**: feature-planning.md ベース

---

## Scene 1: ユーザーストーリー — 「誰がいつ update するのか」

**先輩（ナレーション）**:
DGE toolkit は `@unlaxer/dge-toolkit` として npm に配布される。install 後、ユーザーのプロジェクトには `dge/` フォルダと `.claude/skills/dge-session.md` がコピーされる。toolkit 側でキャラ追加・テンプレート改良・skill の MUST ルール変更が入ったとき、ユーザーはどうやってそれを知り、どうやって適用するのか。

**👤 今泉**: 「そもそも、ユーザーは "DGE toolkit がアップデートされた" ことをどうやって知るんですか？ npm install した後はもう node_modules の中の話ですよね。dge/ にコピーした時点で npm とは切れてる。」

→ **Gap 発見**: install 後のファイルは npm の管理外。`npm update` しても `dge/` は更新されない。アップデート通知の仕組みがない。

**☕ ヤン**: 「そりゃそうだ。`npx dge-install` は "dge/ が既にあればスキップ" する設計にした。上書きしない。つまり npm update しても何も起きない。」

**😰 僕**: 「...それって、ユーザーが一度 install したら永遠に古いバージョンのまま...ってことですか？ 怖い...。」

**👤 今泉**: 「要するに、npm update → npx dge-install の 2 ステップだけじゃダメで、"既存の dge/ を新しいバージョンに更新する" 仕組みが別に必要ってことですね？」

→ **Gap 発見**: install（初回セットアップ）と update（既存環境の更新）が同じコマンドで、update が機能しない。

**⚖ ソウル**: 「ここで重要な区別がある。dge/ の中身は 2 種類だ。(1) toolkit が提供したファイル（method.md, catalog.md, templates/）— これは update 対象。(2) ユーザーが作ったファイル（dge/sessions/ の中身、カスタムテンプレート）— これは絶対に触るな。上書きしたら信頼を失う。」

→ **Gap 発見**: toolkit 提供ファイルとユーザー生成ファイルの区別がない。update 時にどれを上書きしてよいか判定できない。

---

## Scene 2: update の選択肢 — 「どうやって更新するか」

**先輩（ナレーション）**:
update 機構の選択肢を整理する。(A) `npx dge-update` コマンドを新設して差分適用。(B) skill が session 開始時にバージョンチェックして通知。(C) dge/ をコピーせず node_modules から直接参照（update = npm update だけで完結）。(D) git submodule（前回却下済み）。

**☕ ヤン**: 「(C) が一番楽じゃない？ dge/ にコピーしないで、skill が `node_modules/@unlaxer/dge-toolkit/method.md` を直接読む。update は `npm update` だけ。コピーもマイグレーションも不要。」

**👤 今泉**: 「そもそも、それって動くんですか？ Claude Code の skill が node_modules の中のファイルを読める？」

**☕ ヤン**: 「skill は "dge/method.md を読め" と書いてある。パスを `node_modules/@unlaxer/dge-toolkit/method.md` に変えれば読める。ただ長い。」

**😰 僕**: 「...でも、npm がないプロジェクトではどうするんですか？ Go とか Rust のプロジェクトで npm install したくない人もいますよね...？ コピー版は残さないと...。」

→ **Gap 発見**: node_modules 直接参照は npm 前提。非 npm プロジェクトのサポートが切れる。

**⚖ ソウル**: 「2 つのパスを両方サポートしろ。(1) npm ユーザー: node_modules から直接参照。update = npm update。(2) コピーユーザー: dge/ にコピー。update = 手動 or dge-update コマンド。skill がどちらのパスも探せるようにすればいい。」

**👤 今泉**: 「他にないの？ skill が session 開始時にバージョンチェックするのはどうですか？ "あなたの DGE toolkit は v1.0.0 です。最新は v1.2.0 です。更新しますか？" って。」

→ **Gap 発見**: バージョン情報が dge/ 内に記録されていない。skill がバージョンを知る手段がない。

**☕ ヤン**: 「バージョンチェックはネットワーク接続が必要。`npm view @unlaxer/dge-toolkit version` を叩くことになる。オフラインで使いたい人もいるし、CI で余計な外部アクセスは嫌がられる。」

**😰 僕**: 「...だったら、ローカルのバージョンだけ表示すればいいんじゃないですか...？ dge/ に `version.txt` を入れておいて、skill が "現在 v1.0.0 です" って表示するだけ。最新版との比較は README に "最新版は GitHub を確認" って書いておけば...。」

→ **Gap 発見**: バージョン通知のレベルが未定義。ローカル表示のみ / ネットワーク比較 / 自動更新の 3 段階がある。

---

## Scene 3: migration — 「ファイル構成が変わったとき」

**先輩（ナレーション）**:
v1 → v2 で skill の MUST ルールが変わる、テンプレートの構造が変わる、dge/ 内のファイル配置が変わる、等の breaking change が起きた場合の対応。ユーザーの dge/ を壊さずに新しい構造に移行する必要がある。

**👤 今泉**: 「そもそも、migration が必要になる頻度ってどのくらいですか？ DGE toolkit は markdown ファイルの集合で、スキーマもデータベースもない。"ファイル構成が変わった" って具体的にどういうケースですか？」

**☕ ヤン**: 「現実的に起きるのは: (1) skill の手順が変わる（MUST ルール追加等）、(2) テンプレートが増える、(3) method.md のセクション構造が変わる。(1) は skill ファイルの上書き。(2) は新ファイルの追加。(3) は method.md の上書き。どれも "上書きしていいファイル" と "触るなファイル" を分ければ解決する。」

**⚖ ソウル**: 「migration スクリプトを書くのは過剰だ。markdown の kit に migration は要らない。代わりに `npx dge-update` コマンドを作れ。中身は:

1. toolkit 提供ファイルを上書きコピー（method.md, catalog.md, templates/, skills/）
2. ユーザー生成ファイルに触らない（sessions/）
3. 差分を表示する（何が変わったか）
4. breaking change がある場合は CHANGELOG を表示して確認を求める

これで十分。」

→ **Gap 発見**: `dge-install`（初回）と `dge-update`（更新）のコマンド分離が必要。

**😰 僕**: 「...上書きコピーって、ユーザーが method.md をカスタマイズしてたらどうするんですか...？ "自分のプロジェクト用にメソッドを微調整した" って人もいるかも...。」

→ **Gap 発見**: toolkit 提供ファイルをユーザーがカスタマイズしていた場合、update で上書きすると変更が消える。

**☕ ヤン**: 「それはユーザーの責任。git で diff 見ればいい。でもまあ、`dge-update` が上書き前に diff を表示して "上書きしますか？" って聞けばいいか。」

**👤 今泉**: 「前もそうだったっけ？ eslint とか prettier って config を update するとき "overwrite? (y/n)" って聞くの？」

**☕ ヤン**: 「聞かない。config は別ファイルだから。ツール本体は node_modules で勝手に上がる。config は触らない。...あ、これだ。DGE もそうすべき。method.md, catalog.md, templates/ は "ツール本体" だからユーザーがカスタマイズするものじゃない。カスタマイズしたければ `dge/custom/` に別ファイルで置く。本体は常に上書き OK。」

→ **Gap 発見**: "ツール本体"（上書き OK）と "設定"（触るな）の分離が install 時点で不十分。sessions/ だけでなく custom/ も保護対象にすべき。

**⚖ ソウル**: 「これを明文化しろ。dge/ 内のファイルに "管理者" を定義する:

```
dge/
├── [toolkit] README.md       ← update で上書きされる
├── [toolkit] LICENSE          ← 上書きされる
├── [toolkit] method.md        ← 上書きされる
├── [toolkit] version.txt      ← 上書きされる
├── [toolkit] characters/      ← 上書きされる
├── [toolkit] templates/       ← 上書きされる
├── [user]    sessions/        ← 絶対に触らない
└── [user]    custom/          ← 絶対に触らない
```

実際にラベルは付けないが、dge-update スクリプトがこの区別を知っている。」

---

## Scene 4: skill による自動化 — 「session 開始時に何をするか」

**先輩（ナレーション）**:
skill が session 開始時にバージョンチェックや update 提案を行う可能性を検討する。skill は Claude Code の中で動くので、bash コマンド実行も可能。

**👤 今泉**: 「そもそも、DGE session を始めようとしてるのにバージョンチェックで止められるのって、ユーザーは嬉しいですか？ "DGE して" って言ったのに "まず update しますか？" って返されたら面倒では？」

**☕ ヤン**: 「嫌だ。session のフローに update を混ぜるな。別の skill にしろ。`dge-update` skill を作って、"DGE を更新して" と言われたときだけ発動。session skill はセッションに集中。」

→ **Gap 発見**: update 機能を session skill に混ぜるか、別 skill にするかの設計判断。

**😰 僕**: 「...でも、session 開始時にバージョン表示くらいはしてもいいんじゃないですか...？ "DGE toolkit v1.0.0" って 1 行出すだけ。邪魔にならない...。」

**⚖ ソウル**: 「バージョン表示は SHOULD でいい。表示するだけで止めない。update の提案は別 skill。これなら邪魔にならない。」

**⚖ ソウル**: 「update skill の設計はこうだ:

```
Trigger: "DGE を更新して" / "dge update"

手順:
1. dge/version.txt を読んでローカルバージョンを確認
2. npm の場合: package.json を確認して最新を表示
3. 差分を表示（何が変わるか）
4. ユーザーに確認: "更新しますか？ (toolkit ファイルが上書きされます。sessions/ と custom/ は触りません)"
5. Yes → 上書きコピー + version.txt 更新
6. No → 何もしない
```

これで十分。自動 update は危険。必ずユーザー確認。」

**👤 今泉**: 「npm update と dge-update skill の関係はどうなりますか？ npm update したら node_modules は最新になる。でも dge/ は古いまま。skill で "dge/ を更新して" と言えば node_modules から dge/ にコピーされる。この 2 段階で合ってます？」

**☕ ヤン**: 「合ってる。npm update = ソースを最新にする。dge-update skill = ソースから dge/ に反映する。分離されてるのがいい。npm がない人は GitHub から kit/ を pull して手動で上書き。」

→ **Gap 発見**: npm update → skill で dge/ 反映の 2 段階フローが必要。ワンステップにするかどうか。

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 28 | install 後のファイルは npm 管理外。update 通知の仕組みがない | Ops gap | **High** |
| 29 | install と update が同じコマンドで、update が機能しない | Spec-impl mismatch | **Critical** |
| 30 | toolkit 提供ファイルとユーザー生成ファイルの区別がない | Missing logic | **High** |
| 31 | node_modules 直接参照は非 npm プロジェクトのサポートが切れる | Integration gap | Medium |
| 32 | バージョン情報が dge/ 内に記録されていない | Missing logic | **High** |
| 33 | バージョン通知のレベル（表示のみ / 比較 / 自動更新）が未定義 | Spec-impl mismatch | Medium |
| 34 | dge-install と dge-update のコマンド分離が必要 | Missing logic | **High** |
| 35 | ユーザーがカスタマイズした toolkit ファイルが上書きで消える | Safety gap | Medium |
| 36 | "ツール本体" vs "設定" の分離が install 時点で不十分 | Missing logic | Medium |
| 37 | update を session skill に混ぜるか別 skill にするかの判断 | Missing logic | **High** |
| 38 | npm update → skill で反映の 2 段階フロー | Ops gap | Medium |

---

## Gap 詳細（Critical + High）

### Gap-29 [Critical]: install と update の分離
- **Observe**: `npx dge-install` は dge/ が存在するとスキップする。update 機能がない
- **Suggest**: `npx dge-update` コマンドを新設。toolkit 提供ファイルのみ上書き
- **Act**: install.sh とは別に update.sh を作成。package.json の bin に `dge-update` を追加

### Gap-28: update 通知
- **Observe**: install 後のファイルは npm 管理外。ユーザーは新バージョンの存在を知れない
- **Suggest**: dge/version.txt にバージョンを記録。session skill が SHOULD で表示
- **Act**: install 時に `version.txt` を生成。session skill の Step 1 でバージョン表示（1 行、フローは止めない）

### Gap-30: toolkit ファイル vs ユーザーファイルの区別
- **Observe**: dge/ 内の全ファイルが同列。update 時にどれを上書きしてよいか判定不能
- **Suggest**: update スクリプトにファイル管理ポリシーをハードコード
- **Act**:
```
上書き OK（toolkit 管理）: README.md, LICENSE, version.txt, method.md, characters/, templates/
触るな（ユーザー管理）: sessions/, custom/
```

### Gap-32: バージョン情報の記録
- **Observe**: dge/ にバージョン情報がない。skill も update スクリプトも現在のバージョンを知れない
- **Suggest**: `dge/version.txt` を install/update 時に生成
- **Act**: `echo "1.0.0" > dge/version.txt`（package.json の version と同期）

### Gap-34: dge-install と dge-update の分離
- **Observe**: 初回 install と更新が同じコマンド。更新時にスキップされる
- **Suggest**: bin に `dge-install`（初回）と `dge-update`（更新）を分ける
- **Act**: update.sh を新規作成。toolkit ファイルのみ上書き + version.txt 更新 + 差分表示

### Gap-37: update は別 skill にする
- **Observe**: session skill に update チェックを入れるとフローが邪魔になる
- **Suggest**: `dge-update` skill を別途作成。"DGE を更新して" で発動
- **Act**: `kit/skills/dge-update.md` を新規作成。session skill はバージョン表示（SHOULD）のみ

---

## MVP 成果物

| # | 成果物 | 対応 Gap |
|---|--------|---------|
| 1 | `kit/update.sh`（dge-update コマンド） | #29, #34 |
| 2 | `dge/version.txt` を install/update で生成 | #28, #32 |
| 3 | update.sh にファイル管理ポリシー実装 | #30, #35, #36 |
| 4 | `kit/skills/dge-update.md`（update skill） | #37 |
| 5 | session skill にバージョン表示（SHOULD）追加 | #28, #33 |
| 6 | package.json に `dge-update` bin 追加 | #34 |

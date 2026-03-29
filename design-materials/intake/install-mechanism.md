# DGE Session: DGE toolkit のインストール機構

- **日付**: 2026-03-29
- **テーマ**: DGE toolkit を他プロジェクトに導入する最適な仕組み
- **キャラクター**: 今泉 + ヤン + 僕 + リヴァイ
- **理由**: 今泉（前提を問う）、ヤン（不要なものを削る）、僕（現実的なスケール）、リヴァイ（実装を詰める）

---

## Scene 1: 基本フロー — 「何をコピーするのか」

**先輩（ナレーション）**:
現状の DGE toolkit のインストールは `cp -r dge/ /path/to/project/dge/` と `cp skills/*.md .claude/skills/` の 2 コマンド。toolkit 全体は約 150 ファイル、59 の .md ファイルがある。ただし、paper/, sessions/meta/, design-materials/ は方法論の検証や研究用であり、実際の DGE 実行には不要。ユーザーが必要とするのは method.md, characters/, templates/, skills/, examples/ の一部。

**👤 今泉**: 「そもそも、150 ファイルを全部コピーする必要あるんですか？ paper とか sessions/meta/ とか、これ論文を書いた人のためのもので、DGE を使いたいだけの人には関係ないですよね？」

→ **Gap 発見**: toolkit の「配布物」と「開発物」が分離されていない。リポジトリ全体 = 配布物になっている。

**☕ ヤン**: 「要らなくない？ 実際に使うのは method.md, characters/catalog.md, templates/, skills/ の 4 つだけでしょ。それ以外は全部荷物。」

→ **Gap 発見**: 最小インストールセットが定義されていない。

**😰 僕**: 「あの、でも quality-criteria.md とか gap-definition.md とか limitations.md も、使い方を理解するには必要じゃないですか...？ 全部捨てると、新しい人が "Gap って何？" ってなりません...？」

→ **Gap 発見**: 「実行に必要なファイル」と「理解に必要なファイル」の区別がない。

**⚔ リヴァイ**: 「汚い。install コマンドを叩いたら必要なものだけ入る。それ以外は要らん。README に URL 書いとけ。」

---

## Scene 2: エッジケース — 「インストール方法の選択肢」

**先輩（ナレーション）**:
toolkit を他プロジェクトに導入する方法はいくつかある:
(A) cp でフォルダごとコピー（現状）
(B) git submodule で参照
(C) npm/pip のようなパッケージマネージャー
(D) CLAUDE.md に参照パスを書く（コピーせず外部参照）
(E) install スクリプト（必要なファイルだけ選んでコピー）
(F) Claude Code の設定で外部 skill パスを指定

**☕ ヤン**: 「submodule は地獄。100% のエンジニアが嫌がる。npm も .md ファイルだけのパッケージって異質すぎる。要らない。」

**👤 今泉**: 「そもそも、DGE toolkit を "アップデート" したくなることってあるんですか？ 一回コピーして終わりなら submodule もパッケージマネージャーも要らないですよね。逆にアップデートが必要なら、コピーじゃダメですよね。」

→ **Gap 発見**: toolkit のバージョニングとアップデート戦略が未定義。コピーしたら凍結？追従する？

**😰 僕**: 「小規模にしませんか...？ 僕のプロジェクト、git submodule は CI で問題起きるし、npm はフロントエンドじゃないと入ってないし...。cp が一番確実じゃないですか？」

**⚔ リヴァイ**: 「選択肢が多すぎる。作れ。install.sh を 1 つ。叩いたら終わる。以上。」

→ **Gap 発見**: ユーザーの技術レベルや環境（Node.js あり/なし、monorepo/単体）に応じたインストールパスが未設計。

**👤 今泉**: 「他にないの？ Claude Code って `.claude/settings.json` に skill パスを外部参照できるんじゃなかったっけ？ だったらコピーすら要らないのでは。」

→ **Gap 発見**: Claude Code のネイティブ機能（外部 skill 参照、MCP server 等）を活用した zero-copy インストールの可能性が未調査。

---

## Scene 3: 運用 — 「プロジェクトに入った後」

**先輩（ナレーション）**:
toolkit をインストールした後の運用を考える。ユーザーは DGE session の結果をどこに保存するのか。characters/ をカスタマイズしたい場合はどうするのか。プロジェクト固有のテンプレートを追加した場合、toolkit アップデートとの競合はどうなるのか。

**👤 今泉**: 「そもそも、CLAUDE.md に何を書くんですか？ 『dge/ を読んで DGE できるようにして』って 1 行だけ？ それともキャラ一覧まで全部書くんですか？」

→ **Gap 発見**: CLAUDE.md への統合指示の粒度が未定義。最小限の記述 vs 完全な記述。

**☕ ヤン**: 「CLAUDE.md に 1 行だけ書く。"DGE してと言われたら dge/skills/dge-session.md を読め"。以上。skills が本体への参照を持ってるんだから、CLAUDE.md はポインタだけでいい。」

**😰 僕**: 「でも、CLAUDE.md って Claude Code 専用ですよね...？ ChatGPT で DGE したい人は...？」

→ **Gap 発見**: Claude Code 以外の LLM ユーザー向けのインストールパスが弱い。skills/ は Claude Code 専用機能。

**⚔ リヴァイ**: 「DGE の結果ファイルはどこに入る。dge/sessions/ か？ プロジェクトの docs/ か？ 定義しろ。」

→ **Gap 発見**: session 出力の保存先ポリシーが未定義。toolkit 内に混ぜるのか、プロジェクト側に置くのか。

**👤 今泉**: 「前もそうだった。eslint も prettier も、config ファイルをプロジェクトに置いて、ツール本体は node_modules に入れる。DGE も "config（テンプレート・キャラ選択）" と "ツール本体（method.md, characters/）" を分離すべきでは？」

→ **Gap 発見**: toolkit の「ライブラリ部分」（不変）と「設定部分」（プロジェクト固有）の分離がされていない。

---

## Scene 4: 実装判断 — 「何を作るか」

**先輩（ナレーション）**:
ここまでの議論で、install 機構の設計空間が見えてきた。現実的な制約として: (1) DGE toolkit は markdown ファイルの集合でコードはない、(2) MIT ライセンス、(3) 主なユーザーは Claude Code ユーザーだが LLM 非依存を謳っている、(4) メンテナは少人数。

**☕ ヤン**: 「一番楽なの教えてあげる。`dge-core/` を作って immutable な本体を置く。`dge.config.md` を 1 つプロジェクトルートに置いて、使うテンプレートとキャラを書く。install は `cp -r` でいい。パッケージマネージャーは要らない。」

**⚔ リヴァイ**: 「install.sh を書け。中身は:
1. dge-core/ をコピー（method + characters + templates）
2. .claude/skills/ に skill をコピー
3. CLAUDE.md に DGE の 1 行を追記
4. 終わり。10 行で書ける。」

**👤 今泉**: 「要するに、コピーでいいけど "何を" コピーするかを整理すればいいんですよね？ 今の問題はリポジトリ全体がコピー対象になってること。dist/ 的なフォルダを作って、そこだけコピーすれば解決では。」

**😰 僕**: 「あの...アップデートの話はどうなりました？ 半年後に characters/ に新キャラが追加されたとき、もう一回全部コピーし直すんですか？」

**☕ ヤン**: 「しょうがない。markdown だから diff も見やすいし、git submodule よりマシ。"アップデートしたかったら最新を cp" でいいでしょ。差分は git diff で見れる。」

→ **Gap 発見**: アップデート手順（upgrade path）の具体的なドキュメントがない。

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 1 | 配布物と開発物が分離されていない | Missing logic | **High** |
| 2 | 最小インストールセットが未定義 | Spec-impl mismatch | **High** |
| 3 | 「実行に必要」vs「理解に必要」の区別がない | Message gap | Medium |
| 4 | バージョニング・アップデート戦略が未定義 | Ops gap | Medium |
| 5 | 環境に応じたインストールパスが未設計 | Missing logic | Low |
| 6 | Claude Code の外部参照機能の調査不足 | Integration gap | **High** |
| 7 | CLAUDE.md への統合指示の粒度が未定義 | Message gap | **High** |
| 8 | Claude Code 以外のユーザー向けパスが弱い | Business gap | Medium |
| 9 | session 出力の保存先ポリシーが未定義 | Ops gap | Medium |
| 10 | ライブラリ部分と設定部分が未分離 | Missing logic | **High** |
| 11 | アップデート手順のドキュメントがない | Ops gap | Low |

---

## Gap 詳細（High のみ）

### Gap-1: 配布物と開発物の分離
- **Observe**: リポジトリに paper/, sessions/meta/, design-materials/ など開発・研究用ファイルが混在
- **Suggest**: `dist/` または `kit/` フォルダを作り、配布対象のみを格納
- **Act**: 以下の構造に分離

```
DGE-toolkit/          ← 開発リポジトリ
├── kit/              ← ★配布物（これだけコピーする）
│   ├── method.md
│   ├── characters/
│   ├── templates/
│   ├── skills/
│   ├── examples/
│   └── references/   ← quality-criteria, gap-definition, limitations
├── paper/            ← 研究用（配布しない）
├── sessions/         ← 検証用（配布しない）
└── design-materials/ ← 運用用（配布しない）
```

### Gap-2: 最小インストールセット
- **Observe**: 何をコピーすれば DGE が実行できるかが明示されていない
- **Suggest**: `kit/` に含めるファイルリストを MANIFEST として定義
- **Act**: install.sh に最小セットを明記

### Gap-6: Claude Code 外部参照の調査
- **Observe**: Claude Code の skills は外部パスを参照できる可能性がある（projectDocPaths等）
- **Suggest**: コピー不要の参照型インストールが可能か調査
- **Act**: `.claude/settings.json` の `projectDocPaths` で toolkit を参照できれば zero-copy install が実現可能

### Gap-7: CLAUDE.md 統合指示
- **Observe**: CLAUDE.md に何をどう書けば DGE が発動するか未定義
- **Suggest**: 最小限の CLAUDE.md 追記テンプレートを用意
- **Act**:
```markdown
## DGE (Design-Gap Exploration)
「DGE して」で設計レビューの会話劇を生成。
詳細: dge/method.md
```

### Gap-10: ライブラリ vs 設定の分離
- **Observe**: characters/, templates/ は全プロジェクト共通だが、ユーザーがカスタムキャラやテンプレートを追加したい場合に toolkit 本体と混ざる
- **Suggest**: `dge/custom/` をプロジェクト固有の拡張用に分離
- **Act**: skill が `dge/custom/` → `dge/templates/` の優先順位で参照する設計

---

## 提案: 推奨インストール構造

```
your-project/
├── .claude/
│   ├── skills/
│   │   ├── dge-session.md      ← toolkit から cp
│   │   └── dge-template-create.md
│   └── settings.json           ← (将来: 外部参照)
├── CLAUDE.md                   ← 3行追記
├── dge/                        ← kit/ の中身をコピー
│   ├── method.md
│   ├── characters/
│   │   ├── catalog.md
│   │   └── custom-guide.md
│   ├── templates/
│   ├── examples/
│   └── custom/                 ← プロジェクト固有（.gitignore しない）
│       ├── characters/         ← カスタムキャラ
│       └── templates/          ← カスタムテンプレート
```

---

## Next Actions

- [ ] Gap-6: Claude Code の外部参照機能を調査（zero-copy の可能性）
- [ ] Gap-1, 2: kit/ フォルダを作成し配布物を分離
- [ ] Gap-7: CLAUDE.md テンプレートを作成
- [ ] Gap-10: custom/ ディレクトリの設計と skill の参照順序を実装
- [ ] Gap-4, 9, 11: 運用ドキュメント（アップデート手順、session 保存先）を作成

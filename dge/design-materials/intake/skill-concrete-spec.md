# DGE Session: 配布用 skill の具体的な記述内容

- **日付**: 2026-03-29
- **テーマ**: kit/skills/dge-session.md の具体的な記述内容を決定する
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル
- **テンプレート**: feature-planning.md ベース
- **前提**: 3 sessions 分の Gap を踏まえた MVP の具体化

---

## Scene 1: skill の構造 — 「何をどの順で書くか」

**先輩（ナレーション）**:
前回までで配布用 skill に含めるべき要素が整理された。(1) ライセンスヘッダ、(2) 前提条件、(3) Trigger、(4) MUST/SHOULD ルール、(5) 手順（Step 1-9）、(6) 出力フォーマット仕様、(7) 判断ルール（auto-decide vs ask）。問題はこれらの順序と粒度。LLM が上から読んで実行する前提。

**👤 今泉**: 「そもそも、LLM はこの skill をどのタイミングで読むんですか？ ユーザーが "DGE して" と言った瞬間に全文読み込まれるんですよね？ だったらルールを先に書くか、手順を先に書くかで実行の正確さが変わりませんか？」

**☕ ヤン**: 「ルールが先。手順の途中で "あ、MUST ルールがあった" と後から気づくより、最初にルールを把握して手順に入るほうが安定する。AskOS の autonomous-behavior.md も MUST を先に書いてる。」

**🎩 千石**: 「同意しますが、Trigger は最初に書くべきです。LLM が skill を読んで "これは自分が発動すべきか？" を最初に判断する必要がある。順序は: Trigger → 前提条件 → MUST/SHOULD → 手順 → 出力フォーマット。」

**⚖ ソウル**: 「ライセンスヘッダは最初の最初。HTML コメントで書けば LLM の判断に影響しない。そして前提条件の後に "このファイルのパスについて" を入れろ。`dge/` がプロジェクトルートにある前提だということを。これは免責事項だ。」

→ **Gap 発見**: skill 内のセクション順序が LLM の実行精度に影響する可能性があるが、最適な順序が検証されていない。

**👤 今泉**: 「他にないの？ AskOS の skill で "こういう順序で書いてあるから上手くいってる" って例はありますか？」

**☕ ヤン**: 「AskOS の story-driven-discovery.md が参考になる。Purpose → When to use → Procedure → Tips の順。DGE で言えば Trigger → Preconditions → Rules → Procedure → Output format → Notes。シンプル。」

---

## Scene 2: MUST ルールの具体的な文面 — 「LLM が誤解しない書き方」

**先輩（ナレーション）**:
Gap-15 で「主観的表現を避けて客観的条件で書く」方針が出た。ここで配布用 skill の MUST/SHOULD の具体的な文面を確定する。LLM が一貫して同じ行動をとれる記述が求められる。

**🎩 千石**: 「私が MUST ルールのドラフトを出します:

1. **Step 1 で dge/method.md が見つからない場合、session を開始せず install 案内を出す**
2. **キャラクター選択は必ずユーザーに提示して確認を得てから進む。確認なしで会話劇を生成しない**
3. **session 出力は markdown ファイルとして保存する。保存先がない場合は作成前にユーザーに確認する**
4. **会話劇の後、Gap 一覧テーブルを出力する。テーブルの列は: #, Gap, Category, Severity**
5. **サマリー表示後、ユーザーの次のアクション指示を待つ。勝手に次の session や実装を開始しない**」

**👤 今泉**: 「2 番目、"確認を得てから" は分かる。でも "提示して" の形式は？ "今泉 + 千石 + 僕 を推奨します。変更しますか？" って聞くのか、"以下から選んでください: (a) 今泉+千石+僕 (b) 今泉+ヤン+僕 (c) カスタム" って選択肢を出すのか。」

**☕ ヤン**: 「推奨セットを 1 つ出して "変更しますか？" で十分。選択肢を全部出すのは重い。catalog.md の推奨組み合わせテーブルがあるんだから、テーマに最も近い 1 つを推奨するだけでいい。」

→ **Gap 発見**: キャラクター提案の形式（推奨 1 セット vs 複数選択肢）が未決定。

**⚖ ソウル**: 「3 番目、"保存先がない場合は作成前にユーザーに確認" は弱い。確認せずにディレクトリを勝手に作るのは問題だ。"保存先ディレクトリが存在しない場合、(a) そのディレクトリを作成する (b) 別の場所を指定する をユーザーに聞く" と具体的に書け。」

**🎩 千石**: 「SHOULD ルールも:

1. **テンプレート候補が 1 つなら自動選択し報告する。2 つ以上ならユーザーに提示する**
2. **Gap 詳細は Observe / Suggest / Act の構造で書く**
3. **会話劇は 3-5 Scene で構成する。先輩（ナレーション）で各 Scene の背景を設定する**
4. **サマリー表示時に全文ファイルへのパスを表示する**
5. **サマリーの後に選択肢を提示する: DGE を回す / 実装する / 後で**」

**👤 今泉**: 「5 番目は MUST じゃないですか？ 選択肢を出さないとユーザーが何をすればいいか分からない。」

**🎩 千石**: 「...正しい。5 番を MUST に昇格します。」

→ **Gap 発見**: MUST と SHOULD の境界が議論で揺れる。判断基準は「これがないと session が壊れるか」。

---

## Scene 3: 出力フォーマット — 「何がブレてはいけないか」

**先輩（ナレーション）**:
3 回の DGE session で出力形式にバラつきがあった。1 回目は Gap 一覧テーブルの Category 列あり、2 回目も同様、3 回目もあり。ただしファイルヘッダ（日付、テーマ、キャラクター）の形式は微妙に異なっていた。どこまで固定し、どこまで柔軟にするか。

**☕ ヤン**: 「固定するのは 3 つだけでいい: (1) ファイルヘッダ、(2) Gap 一覧テーブル、(3) サマリー表示形式。会話劇の書き方は method.md に委ねる。skill に書くのは出力の "構造" だけ。」

**🎩 千石**: 「ファイルヘッダの形式を確定させましょう:

```markdown
# DGE Session: [テーマ]

- **日付**: YYYY-MM-DD
- **テーマ**: [テーマの 1 行説明]
- **キャラクター**: [使用キャラクター]
- **テンプレート**: [使用テンプレート名] または "カスタム"
```

これは MUST です。」

**👤 今泉**: 「Gap 一覧テーブルの Severity は誰が決めるんですか？ LLM が自分で判断？ それともユーザーに確認？」

**☕ ヤン**: 「LLM が判断。Severity の基準は gap-definition.md に書いてある。skill が gap-definition.md を読むかどうかは... 読まなくていい。skill に Severity の判断基準を 4 行で書く。Critical = 実装不能、High = 重要な機能に影響、Medium = 品質に影響、Low = 改善レベル。」

→ **Gap 発見**: Severity 判断基準が skill 内にない。gap-definition.md への参照もない。LLM が独自基準で判定してしまう。

**⚖ ソウル**: 「サマリー表示形式も固めろ。ユーザーが見る画面がブレるのは信頼を損なう:

```
## DGE 結果サマリー

**テーマ**: [テーマ]
**Gap 数**: N 件（Critical: X / High: X / Medium: X / Low: X）

| # | Gap | Severity |
|---|-----|----------|
（High 以上を表示、Medium 以下は省略可）

**全文**: `[ファイルパス]`

どうしますか？
- **DGE を回す** → この結果をさらに深掘り
- **実装する** → Gap を Task に変換
- **後で** → 保存したまま終了
```

テーブルは画面表示用なので Category 列を省略して Severity だけ。全文ファイルには Category も入れる。」

**🎩 千石**: 「美しい。画面表示と保存ファイルで情報量が違うのは正しい設計です。」

**👤 今泉**: 「"レビューOK" の選択肢は配布版だと不要ですよね？ intake → completed の移動は DGE-toolkit リポジトリの話だから。」

**☕ ヤン**: 「そう。配布版は 3 択: DGE を回す / 実装する / 後で。開発版は 4 択: + レビューOK。」

→ **Gap 発見**: サマリー後の選択肢が配布版と開発版で異なるべき。

---

## Scene 4: kit/ のファイル構成 — 「何を入れて何を入れないか」

**先輩（ナレーション）**:
最後に kit/ の具体的なファイル構成を決める。前回 "method.md, characters/, templates/, skills/, examples/, references/" が候補に上がった。配布物のサイズとユーザーの初回体験のバランス。

**☕ ヤン**: 「最小。

```
kit/
├── LICENSE
├── README.md          ← install 手順 + クイックスタート
├── method.md
├── characters/
│   ├── catalog.md
│   └── custom-guide.md
├── templates/
│   ├── api-design.md
│   ├── feature-planning.md
│   ├── go-nogo.md
│   ├── incident-review.md
│   └── security-review.md
└── skills/
    └── dge-session.md
```

examples/ は要らない。method.md の中にクイックスタート例がある。references/（quality-criteria, gap-definition, limitations）も要らない。上級者向けの情報は GitHub の README にリンクすればいい。」

**🎩 千石**: 「custom-guide.md は必要ですか？ 初回ユーザーはカスタムキャラを作りません。catalog.md の 12 キャラで十分です。」

**☕ ヤン**: 「確かに。削る。」

**👤 今泉**: 「そもそも、kit/README.md と リポジトリの README.md は別物ですか？ kit/ の中にも README があって、リポジトリのルートにも README がある。ユーザーはどっちを読むんですか？」

→ **Gap 発見**: kit/README.md とリポジトリ README.md の役割分担が不明確。

**⚖ ソウル**: 「kit/README.md は "install 後のユーザーが読む取扱説明書"。リポジトリ README.md は "install 前のユーザーが読むランディングページ"。別の文書だ。kit/README.md には:

1. 使い方（"DGE して" と言え）
2. キャラクター早見表（catalog.md から抜粋）
3. ライセンス表示（MIT, keep this file）

リポジトリ README.md には:

1. DGE とは
2. 実績
3. install 手順
4. リンク集（paper, examples, 詳細ドキュメント）

これなら install 後に kit/ だけあればユーザーは迷わない。」

**🎩 千石**: 「kit/README.md をインストール先で `dge/README.md` としてコピーする。ユーザーが `dge/` を見たとき最初に目に入るのがこの README。"DGE して" と言えばいいんだな、とすぐ分かる。これが正しいオンボーディングです。」

**👤 今泉**: 「あと dge-template-create.md は kit/skills/ に入れないんですか？」

**☕ ヤン**: 「v1 では入れない。dge-session.md 1 つで十分。テンプレート作成は上級者向け。v2 で。」

**⚖ ソウル**: 「最終確認。kit/ に入れるファイルは全て MIT ライセンスの対象だ。characters/catalog.md のキャラクターは全て IP-safe な表記になってるか？ "古畑任三郎" "進撃の巨人" のような固有名詞が残っていたら、配布物としてリスクがある。」

→ **Gap 発見**: kit/ 配布物内のキャラクター記述に IP リスクのある固有名詞が残っている可能性。catalog.md の "古畑任三郎"、"銀河英雄伝説" 等。

**🎩 千石**: 「characters/atlas.md は IP-safe なリファレンスとして作られたはず。catalog.md もフィクション作品名は "思考パターンの参考元" として記述されており、キャラクター自体はオリジナルの名前（今泉、千石等）を使っている。ただし配布物では注記を入れるべきです。」

**⚖ ソウル**: 「kit/characters/catalog.md の冒頭に "キャラクター名はオリジナルです。括弧内の作品名は思考パターンの参考元を示すものであり、当該作品との公式な関連はありません" と入れろ。1 行の免責で済む。」

---

## Gap 一覧（本 session 分）

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 21 | skill 内セクション順序の最適化が未検証 | Missing logic | Low |
| 22 | キャラクター提案の形式（推奨1セット vs 複数選択肢）が未決定 | Spec-impl mismatch | Medium |
| 23 | MUST と SHOULD の境界判断基準が不明確 | Error quality | Medium |
| 24 | Severity 判断基準が skill 内にない | Spec-impl mismatch | **High** |
| 25 | サマリー後の選択肢が配布版と開発版で異なるべき | Spec-impl mismatch | Medium |
| 26 | kit/README.md とリポジトリ README.md の役割分担が不明確 | Message gap | **High** |
| 27 | kit/ 配布物内の IP リスク（キャラクター固有名詞） | Legal gap | **High** |

---

## Gap 詳細（High のみ）

### Gap-24: Severity 判断基準
- **Observe**: LLM が Gap の Severity を独自基準で判定してしまい、session 間でブレる
- **Suggest**: skill 内に 4 段階の判断基準を直接記述
- **Act**:
```
Severity 判断基準:
- Critical: これがないと機能が実装不能 / データ損失リスク
- High: 主要ユースケースに影響 / セキュリティリスク
- Medium: 品質・UX に影響するが回避策あり
- Low: 改善レベル / nice-to-have
```

### Gap-26: 2 つの README の役割分担
- **Observe**: kit/README.md（install 後に dge/README.md になる）とリポジトリ README.md が両方必要だが、役割が未定義
- **Suggest**: 明確に分離 — リポジトリ README = ランディングページ、kit/README = 取扱説明書
- **Act**:
  - リポジトリ README: DGE とは / 実績 / install 手順 / リンク集
  - kit/README: 使い方 / キャラクター早見表 / ライセンス

### Gap-27: 配布物の IP リスク
- **Observe**: catalog.md に「古畑任三郎」「銀河英雄伝説」「進撃の巨人」等の作品名が含まれる。MIT ライセンスで配布する際のリスク
- **Suggest**: kit/characters/catalog.md の冒頭に IP 免責注記を追加
- **Act**: `※ キャラクター名はオリジナルです。括弧内は思考パターンの参考元を示すもので、当該作品との公式な関連はありません。`

---

## 累計 Gap サマリー（4 sessions 分）

| Session | Gap 数 | Critical | High | Medium | Low |
|---------|--------|----------|------|--------|-----|
| #1 install-mechanism | 11 | 0 | 5 | 4 | 2 |
| #2 install-config-improvement | 11 | 0 | 5 | 4 | 2 |
| #3 skill-selfcontained-design | 9 | 1 | 5 | 3 | 0 |
| #4 本 session | 7 | 0 | 3 | 3 | 1 |
| **重複排除後** | **~27** | **1** | **~12** | **~10** | **~4** |

---

## 4 Sessions 統合 MVP 成果物

```
kit/
├── LICENSE                    ← MIT ライセンス全文
├── README.md                  ← 取扱説明書（使い方 + 早見表 + ライセンス）
├── method.md                  ← メソッド本体
├── characters/
│   └── catalog.md             ← 12キャラ一覧（IP免責注記付き）
├── templates/
│   ├── api-design.md
│   ├── feature-planning.md
│   ├── go-nogo.md
│   ├── incident-review.md
│   └── security-review.md
└── skills/
    └── dge-session.md         ← 配布用skill（MUST/SHOULD内包）
```

**配布用 skill の構造（確定）**:
```
1. ライセンスヘッダ（HTML コメント）
2. Trigger
3. 前提条件（dge/ の存在チェック + フォールバック）
4. MUST ルール（6項目）
5. SHOULD ルール（4項目）
6. 判断ルール（auto-decide vs ask の条件表）
7. 手順（Step 1-9）
8. 出力フォーマット仕様（ヘッダ / Gap テーブル / サマリー）
9. Severity 判断基準（4段階）
10. 注意事項
```

## Next Actions

- [ ] kit/ ディレクトリを作成し配布物を格納
- [ ] kit/skills/dge-session.md を新規作成（本 session で確定した構造に従う）
- [ ] kit/LICENSE を作成
- [ ] kit/README.md を新規作成（取扱説明書）
- [ ] kit/characters/catalog.md に IP 免責注記を追加
- [ ] リポジトリ README.md を書き直し（ランディングページ + install 手順）
- [ ] skills/dge-session.md を開発用として整理（intake ルール + レビューOK 選択肢）

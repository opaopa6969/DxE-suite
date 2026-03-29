# DGE Session: Gap から実装までの成果物パイプライン

- **日付**: 2026-03-29
- **テーマ**: Gap Category → 成果物マッピング、既存 project workflow とのマージ、directory structure の統合
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル + ハウス + Red Team
- **テンプレート**: feature-planning.md ベース（Scene 2 差し替え）

---

## Scene 1: ユーザーストーリー — 「Gap が見つかった後、何が起きるべきか」

**先輩（ナレーション）**:
現在の DGE skill は「実装する → Gap を Task に変換して実装開始」としか書いていない。Gap 発見から実装までの間に、UC, API Spec, Data Model, ADR, Test Plan, Security Spec, Runbook 等の成果物を作るステップが欠落している。また、DGE toolkit は「他プロジェクトに install するもの」であり、install 先には既に development-workflow.md や STRUCTURE.md 相当のルールが存在する可能性がある。AskOS は 7 フェーズの開発ワークフロー、docs/ の階層構造、constitutional document の概念を持つ。

**👤 今泉**: 「そもそも、DGE toolkit がこの "Gap → Spec → 実装" のパイプラインまで面倒見る必要あるんですか？ DGE は "Gap を発見する" ところまでがスコープで、その後はプロジェクト側のワークフローに任せるのが筋じゃないですか？」

→ **Gap 発見**: DGE toolkit のスコープが不明確。Gap 発見まで vs Spec 化まで vs 実装管理まで。

**🎩 千石**: 「Gap を発見して "はい終わり" では、お客様に対して無責任です。Gap が Spec に落ちて初めて価値がある。"Spec に落とすまでが DGE" — ここまでは DGE のスコープに含めるべきです。ただし実装管理まではやりすぎです。」

**☕ ヤン**: 「同意。DGE の出口は "Spec ファイルの生成" まで。その先の実装はプロジェクトのワークフローの仕事。DGE は "Gap → Spec" のパイプライン。"Spec → 実装" はプロジェクト側。」

→ **Gap 発見**: DGE の出口が「Gap 一覧」なのか「Spec ファイル」なのか未定義。現状は Gap 一覧で止まっている。

**🏥 ハウス**: 「全員嘘をついている。"Spec に落とす" と言ってるが、実際には誰もやらない。Gap 一覧テーブルを見て "ふーん" で終わる。Spec に落とすステップが skill に MUST で入っていなければ、100% スキップされる。前回の "保存し忘れ" と同じパターンだ。Vicodin くれ。」

→ **Gap 発見**: Gap → Spec の変換が MUST として skill に組み込まれていない。SHOULD では実行されない。

**😈 Red Team**: 「もっと悪いケースがある。Gap が 15 個出て、全部 Spec に落とそうとする。ユーザーは途中で疲れて全部放棄する。"Gap → Spec" を強制するなら、優先度でフィルタしないと実用に耐えない。」

→ **Gap 発見**: 全 Gap を Spec 化するのは非現実的。Severity に基づくフィルタリングが必要。

---

## Scene 2: 既存 workflow とのマージ — 「プロジェクトにはルールがある」

**先輩（ナレーション）**:
AskOS の例で具体的に見る。AskOS には `.claude/rules/development-workflow.md`（7 フェーズ: PLAN → DESIGN → IMPLEMENT → VERIFY → DOCUMENT → DEPLOY → HANDOVER）があり、DESIGN フェーズで「spec docs を更新してからコードを書く」が MUST。docs/ には data-model.md, api-surface.md, event-model.md, domain-model.md がある。DGE の出力がこの既存構造のどこに入るかが問題。

**👤 今泉**: 「そもそも、DGE toolkit は AskOS のディレクトリ構造を知らないですよね？ install 先のプロジェクトが docs/ を持ってるかどうかも分からない。"api-surface.md に書け" と言っても、そのファイルがなければ意味がない。」

→ **Gap 発見**: DGE の Spec 出力先が install 先のプロジェクト構造に依存するが、プロジェクト構造を知る手段がない。

**⚖ ソウル**: 「ここが核心だ。DGE toolkit は 2 つのモードを持つべきだ:

(1) **Standalone モード**: プロジェクトに既存の workflow がない。DGE が Spec ファイルを `dge/specs/` に生成する。自己完結。
(2) **Integrated モード**: プロジェクトに既存の workflow がある（CLAUDE.md, rules/, docs/ 等）。DGE は既存の構造に合わせて出力する。

install 時にどちらかを選ばせる。」

**☕ ヤン**: 「2 モードは複雑すぎる。1 つにしろ。DGE は常に `dge/specs/` に Spec を出す。既存の docs/ に統合するかどうかはユーザーの判断。DGE が勝手に docs/api-surface.md を書き換えるのは危険。」

**🏥 ハウス**: 「ヤンは正しいが理由が違う。問題は "DGE が既存の spec を上書きする事故" だ。AskOS の api-surface.md には手動で書いた仕様がある。DGE が Gap から自動生成した API Spec でそれを上書きしたら、既存の仕様が消える。致命傷。」

→ **Gap 発見**: DGE の Spec 出力が既存の spec ドキュメントを上書きするリスク。

**😈 Red Team**: 「上書きだけじゃない。DGE の Spec と既存の Spec が矛盾するケースがある。DGE が "認証には OAuth を使え" と言い、既存の api-surface.md には "JWT ベアラートークン" と書いてある。どっちが正しいかは DGE には判断できない。」

→ **Gap 発見**: DGE の Spec 出力と既存 Spec の矛盾検知・解決メカニズムがない。

**👤 今泉**: 「要するに、DGE は "提案" を出すだけで、既存の docs/ への反映はユーザーが手動でやるべき、ってことですか？」

**🎩 千石**: 「その通りです。DGE は `dge/specs/` に提案を生成する。ユーザーがそれを見て、プロジェクトの docs/ に必要な部分を転記する。DGE が直接 docs/ に書き込むのは品質管理の観点から許容できません。」

→ **Gap 発見**: DGE の Spec 出力は「提案」であり、既存 docs への反映は手動。この設計方針が skill に明記されていない。

---

## Scene 3: Gap Category → 成果物マッピング — 「何を作るか」

**先輩（ナレーション）**:
DGE の Gap は 11 カテゴリに分類される: Missing logic, Spec-impl mismatch, Type/coercion gap, Error quality, Integration gap, Test coverage, Business gap, Safety gap, Ops gap, Message gap, Legal gap。各カテゴリから生成すべき成果物の種類が異なる。

**🎩 千石**: 「マッピングを定義しましょう:

| Gap Category | 主要成果物 | 補助成果物 |
|---|---|---|
| Missing logic | Use Case + API Spec | Data Model |
| Spec-impl mismatch | Design Question (矛盾の記録) | ADR |
| Type/coercion gap | API Spec (型定義) | Test Plan |
| Error quality | Error Catalog | API Spec (エラーレスポンス) |
| Integration gap | Sequence Diagram | API Spec |
| Test coverage | Test Plan | — |
| Business gap | ADR + Design Question | — |
| Safety gap | Security Spec | Test Plan |
| Ops gap | Runbook | Migration Plan |
| Message gap | UI Spec / User Story | — |
| Legal gap | ADR + Legal Review Request | — |

これが品質基準です。」

**☕ ヤン**: 「多すぎる。成果物を 4 つに絞れ:

1. **Use Case** — ユーザーシナリオ。ほとんどの Gap はこれで表現できる
2. **API/Data Spec** — 技術仕様。endpoint, schema, 型
3. **ADR** — 意思決定の記録。選択肢と判断理由
4. **Action Item** — spec にならないもの。"Runbook を書く"、"法務に確認"、"テストを追加"

この 4 つで 11 カテゴリ全部カバーできる。Sequence Diagram とか Error Catalog は SHOULD。」

**👤 今泉**: 「他にないの？ AskOS の Design Question って独立した成果物ですよね。"まだ答えが出てない問い" を記録するファイル。Gap の中には "すぐ spec にならない" ものもある。それは Design Question として残すべきでは？」

→ **Gap 発見**: "すぐ spec にならない Gap"（未決事項、調査が必要）の扱いが未定義。

**🏥 ハウス**: 「全員見落としてることがある。Gap の中には "他の Gap と矛盾する" ものがある。Gap-3 が "認証を追加しろ" と言い、Gap-7 が "ユーザー登録なしで使えるようにしろ" と言う。この矛盾を検知しないまま両方 Spec にしたら、実装で爆発する。」

→ **Gap 発見**: Gap 間の矛盾検知がない。複数 Gap を同時に Spec 化すると矛盾する可能性。

**😈 Red Team**: 「さらに悪いケース。DGE を 5 回回して累計 40 個の Gap が出た。Gap-3（session 1）と Gap-28（session 4）が同じ問題を違う角度から指摘してる。重複に気づかず別々の Spec を書く。工数が 2 倍になる。」

→ **Gap 発見**: 複数 session にわたる Gap の重複検知・統合メカニズムがない。

**⚖ ソウル**: 「ヤンの 4 分類に 1 つ追加しろ。**Design Question** — 未決事項の記録。これで 5 つ:

1. **Use Case** — ユーザーシナリオ
2. **Tech Spec** — API, Data Model, 型定義
3. **ADR** — 意思決定の記録
4. **Design Question** — 未決事項（答えが出たら ADR か Spec に昇格）
5. **Action Item** — Spec にならない作業指示

これは法的文書の分類と同じだ。"確定事項"、"未確定事項"、"作業指示" の 3 層。」

---

## Scene 4: directory structure — 「ファイルをどこに置くか」

**先輩（ナレーション）**:
成果物の種類が決まった。次はこれをどこに保存するか。DGE toolkit は install 先のプロジェクト構造を仮定できない。AskOS は `docs/` に spec を、`stories/` にユースケースを置く。他のプロジェクトは全く違う構造かもしれない。

**☕ ヤン**: 「簡単。全部 `dge/` の中に閉じる:

```
dge/
├── sessions/       ← DGE 会話劇の出力（既にある）
├── specs/          ← Gap から生成した Spec
│   ├── use-cases/
│   ├── tech/
│   ├── adrs/
│   └── questions/
└── actions/        ← Action Items
```

プロジェクトの docs/ には触らない。ユーザーが必要に応じて転記する。」

**🎩 千石**: 「`specs/` の中にさらにサブディレクトリを切るのは過剰です。最初は全部 `dge/specs/` にフラットに置いて、ファイル名のプレフィックスで区別すれば十分:

```
dge/specs/
├── UC-auth-login.md
├── TECH-auth-api-endpoint.md
├── ADR-001-oauth-vs-jwt.md
├── DQ-rate-limit-strategy.md
└── ACT-add-runbook.md
```

ファイル数が 20 を超えたらサブディレクトリを検討。最初からディレクトリを掘るのは過剰設計です。」

**👤 今泉**: 「前もそうだったっけ？ AskOS は最初から `docs/features/completed/`, `docs/features/in-progress/`, `docs/features/planned/` って分けてるけど、あれは 3 つ目のコミットでもう作ってた。でもほとんど空だった。」

**😈 Red Team**: 「ディレクトリ構造よりヤバい問題がある。DGE の Spec と、プロジェクト側の Spec が "同じことを違うファイルに書いてある" 状態になる。`dge/specs/UC-auth-login.md` と `docs/features/auth.md` の両方に認証の仕様がある。どっちが正しい？ 3 ヶ月後に誰かが間違った方を読んで実装する。」

→ **Gap 発見**: DGE specs とプロジェクト docs の二重管理リスク。"Single Source of Truth" が崩れる。

**🏥 ハウス**: 「二重管理の問題は解決不能だ。DGE が `dge/specs/` に書き、ユーザーが `docs/` に転記する。転記した瞬間に `dge/specs/` は outdated になる。でも削除しない。なぜなら "DGE の記録" として残したいから。解決策は 1 つ — `dge/specs/` のファイルに "転記済み" マークを付けて "これは古い。正本は docs/xxx を見ろ" と書く。」

→ **Gap 発見**: Spec の転記後、dge/specs/ 側のファイルが stale になる問題。正本への参照が必要。

**⚖ ソウル**: 「もう 1 つ。既存プロジェクトに CLAUDE.md がある場合、DGE の Spec 生成ルールと既存の development-workflow.md が衝突する可能性がある。AskOS の workflow は "DESIGN フェーズで spec docs を更新してからコードを書く" と言っている。DGE は "dge/specs/ に提案を出す" と言っている。両方従おうとすると、開発者が混乱する。install 時にこの integration ガイドを出すべきだ。」

→ **Gap 発見**: DGE の Spec ワークフローと既存 project workflow の統合ガイドがない。

**👤 今泉**: 「そもそも、AskOS みたいにちゃんとした workflow を持ってるプロジェクトって多いんですか？ ほとんどのプロジェクトは CLAUDE.md すらないんじゃ...」

**☕ ヤン**: 「正しい。大多数のプロジェクトには workflow がない。DGE はまず "workflow がないプロジェクト" をデフォルトとして設計して、"workflow があるプロジェクト" 向けには integration ガイドを 1 枚書けばいい。」

---

## Scene 5: セキュリティと攻撃シナリオ — 「壊れるケース」

**先輩（ナレーション）**:
最後に、このパイプラインが壊れるシナリオを検証する。DGE → Spec → 実装のフローが失敗するケースは何か。

**😈 Red Team**: 「攻撃シナリオを 3 つ:

1. **Gap 洪水攻撃**: ユーザーが DGE を 10 回回して 100 個の Gap を溜める。Spec 化が追いつかない。dge/specs/ が "読まれないファイルの墓場" になる。

2. **Spec 乖離攻撃**: dge/specs/ と docs/ の両方に仕様がある。6 ヶ月後に新メンバーが入って、古い dge/specs/ を信じて実装する。本番障害。

3. **ワークフロー衝突攻撃**: DGE skill が "まず Spec を作れ" と言い、プロジェクトの workflow が "まず Issue を切れ" と言う。開発者がどっちに従うか分からず、結局どちらもやらない。」

→ **Gap 発見**: Gap 蓄積による "Spec 負債" の増大メカニズム。

**🏥 ハウス**: 「もう 1 つ隠れた問題がある。DGE の Spec は "LLM が生成した提案" だ。ユーザーがレビューせずにそのまま実装する。LLM の hallucination が仕様として確定する。"DGE で出た Spec だから正しいはず" という false confidence。これが最も危険な failure mode だ。」

→ **Gap 発見**: DGE 生成の Spec に対する false confidence。LLM 生成物のレビューなしの採用リスク。

**⚖ ソウル**: 「対策は simple だ。dge/specs/ の全ファイルの冒頭に:

```
<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。
     正本に転記済みの場合は [docs/xxx.md] を参照。 -->
```

これは免責であり、同時にリマインダーだ。」

**🎩 千石**: 「そして Spec ファイルに "レビュー済み" のマーカーがないうちは、skill が "この Spec はまだレビューされていません" と警告する。レビュー済みマーカーは人間が手動で付ける。これが品質保証です。」

→ **Gap 発見**: DGE 生成 Spec のレビュー状態管理がない。未レビュー/レビュー済み/転記済みのライフサイクル。

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 39 | DGE のスコープ不明確（Gap 発見まで vs Spec 化まで） | Spec-impl mismatch | **High** |
| 40 | DGE の出口が Gap 一覧で止まっている。Spec 化されない | Missing logic | **Critical** |
| 41 | Gap → Spec 変換が MUST に入っていない | Missing logic | **High** |
| 42 | 全 Gap の Spec 化は非現実的。Severity フィルタが必要 | Missing logic | **High** |
| 43 | Spec 出力先が install 先のプロジェクト構造に依存 | Integration gap | Medium |
| 44 | DGE Spec が既存 spec を上書きするリスク | Safety gap | **High** |
| 45 | DGE Spec と既存 Spec の矛盾検知がない | Missing logic | Medium |
| 46 | "すぐ Spec にならない Gap"（Design Question）の扱い未定義 | Missing logic | Medium |
| 47 | Gap 間の矛盾検知がない | Missing logic | Medium |
| 48 | 複数 session にわたる Gap の重複検知がない | Missing logic | Medium |
| 49 | DGE specs とプロジェクト docs の二重管理リスク | Ops gap | **High** |
| 50 | Spec 転記後の stale ファイル問題 | Ops gap | Medium |
| 51 | DGE workflow と既存 project workflow の統合ガイドがない | Integration gap | **High** |
| 52 | Gap 蓄積による "Spec 負債" | Ops gap | Medium |
| 53 | DGE 生成 Spec への false confidence（レビューなし採用） | Safety gap | **High** |
| 54 | Spec のレビュー状態管理（未レビュー/済/転記済み）がない | Missing logic | **High** |

---

## Gap 詳細（Critical + High）

### Gap-40 [Critical]: DGE の出口が Gap 一覧で止まっている
- **Observe**: 「実装する」を選んだとき、Gap 一覧から直接 Task に変換する。Spec 化のステップがない
- **Suggest**: 「実装する」の前に「Spec 化する」ステップを MUST として挿入
- **Act**: skill の Step 9 の「実装する」分岐を変更:
  `実装する → まず High 以上の Gap を Spec 化 → Spec レビュー → 実装開始`

### Gap-39: DGE のスコープ
- **Observe**: DGE が Gap 発見までなのか Spec 化までなのか不明確
- **Suggest**: 「DGE のスコープは Gap → Spec の提案生成まで。Spec の正式採用と実装はプロジェクト側の責務」と明記
- **Act**: skill と method.md に scope 定義を追加

### Gap-41: Gap → Spec が MUST にない
- **Observe**: Spec 化は method.md の Step 3 に書いてあるが、skill では SHOULD レベル
- **Suggest**: 「実装する」選択時に Spec 化を MUST 化
- **Act**: MUST ルールに追加: 「"実装する" を選んだ場合、High 以上の Gap の Spec を生成してからでなければ実装に進まない」

### Gap-42: Severity フィルタ
- **Observe**: 全 Gap を Spec 化するのは非現実的（20 個の Gap に 20 個の Spec は書かない）
- **Suggest**: Critical/High のみ Spec 化を MUST、Medium 以下は SHOULD
- **Act**: Spec 化ルール: `Critical + High → MUST Spec 化 / Medium → SHOULD / Low → Action Item のみ`

### Gap-44: 既存 spec 上書きリスク
- **Observe**: DGE が既存 docs/ に直接書き込むと仕様が消える
- **Suggest**: DGE は常に `dge/specs/` に出力。既存 docs/ には絶対に書き込まない
- **Act**: MUST ルール追加: 「DGE は dge/specs/ にのみ書き込む。プロジェクトの docs/ や既存ファイルを直接変更しない」

### Gap-49: 二重管理リスク
- **Observe**: dge/specs/ と docs/ に同じ内容が別ファイルで存在する状態
- **Suggest**: dge/specs/ のファイルは「提案 → レビュー → 転記 → archive」のライフサイクルを持つ
- **Act**: Spec ファイルの状態: `draft → reviewed → migrated`。migrated になったら正本への参照を記載

### Gap-51: 既存 workflow との統合ガイド
- **Observe**: AskOS のような workflow を持つプロジェクトで DGE をどう組み込むか不明
- **Suggest**: `kit/` に `integration-guide.md` を追加
- **Act**: 「あなたのプロジェクトに development-workflow がある場合」セクションで、DGE の output をどの phase に注入するか案内

### Gap-53: false confidence
- **Observe**: DGE 生成の Spec をレビューなしで実装するリスク
- **Suggest**: 全 Spec ファイルの冒頭に DGE 生成警告を入れる
- **Act**: Spec ファイルテンプレートに警告ヘッダを MUST で挿入

### Gap-54: レビュー状態管理
- **Observe**: Spec が未レビューか済みか転記済みか判別できない
- **Suggest**: Spec ファイルのフロントマターに status フィールド
- **Act**:
```yaml
---
status: draft | reviewed | migrated
migrated_to: docs/api-surface.md  # migrated の場合のみ
reviewed_by: human                # reviewed の場合のみ
---
```

---

## MVP 成果物

| # | 成果物 | 対応 Gap |
|---|--------|---------|
| 1 | Spec 化ステップを skill の MUST に追加 | #40, #41 |
| 2 | Gap Category → 成果物マッピングテーブル | #40 |
| 3 | Severity フィルタルール（High+ は MUST Spec） | #42 |
| 4 | dge/specs/ ディレクトリ + ファイル命名規則 | #43, #44 |
| 5 | Spec ファイルテンプレート（警告ヘッダ + status フロントマター） | #53, #54 |
| 6 | 「dge/ 内にのみ書き込む」MUST ルール追加 | #44 |
| 7 | integration-guide.md（既存 workflow との統合案内） | #51 |
| 8 | Spec ライフサイクル定義（draft → reviewed → migrated） | #49, #50, #54 |

**成果物の種類（確定）**: Use Case / Tech Spec / ADR / Design Question / Action Item の 5 種

**ファイル命名規則**: `UC-`, `TECH-`, `ADR-`, `DQ-`, `ACT-` プレフィックス

**Spec ライフサイクル**: `draft → reviewed → migrated`

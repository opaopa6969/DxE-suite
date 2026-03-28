# DGE 戦略文書: プラットフォームリスクと Gap-問題相関

> 対象 Critical Gaps: 3-019（プラットフォームリスク）, 3-007（Gap-問題相関）
> 作成日: 2026-03-28

---

## Part 1: プラットフォームリスク分析

### 1.1 脅威シナリオ

DGE の手法は論文として公開済み（ICSE 2027 SEIP Accepted）であり、toolkit は MIT ライセンスで 12 ファイル・957 行。LLM プロバイダーが「読んだら翌日実装できる」規模である。

具体的な脅威シナリオ:

| シナリオ | 時間軸 | 蓋然性 | 影響 |
|----------|--------|--------|------|
| **S1**: Claude が「/design-review」コマンドを内蔵。キャラベースの会話劇を自動生成 | 6-12ヶ月 | 高 | DGE toolkit の存在意義が直接脅かされる |
| **S2**: GPT の Custom GPTs に「Design Review Agent」が公式テンプレートとして登場 | 6-12ヶ月 | 高 | DGE の概念が commodity 化する |
| **S3**: Gemini が Workspace 統合で「設計ドキュメントの自動レビュー」を提供 | 12-18ヶ月 | 中 | エンタープライズ市場で先に浸透する |
| **S4**: GitHub Copilot が PR レビューに adversarial persona を導入 | 12-18ヶ月 | 中 | 開発者の日常ワークフローに組み込まれる |

**正直な評価**: S1 と S2 はほぼ確実に起こる。「会話劇で設計レビュー」というアイデアは、論文を読まなくても誰かが思いつく程度のものだ。DGE の価値は「アイデア」ではなく「方法論の深さ」にある。

### 1.2 DGE の防御可能な差別化

#### A. 方法論としての DGE（ツール非依存・LLM 非依存）

LLM プロバイダーが実装するのは「機能」であり「方法論」ではない。

```
LLM プロバイダーが実装できるもの:
  - キャラクターベースの会話劇生成
  - Gap の自動抽出
  - Spec へのフォーマット変換

LLM プロバイダーが実装しにくいもの:
  - 今泉メソッド（5 Types の問い）の体系的適用
  - Observe → Suggest → Act の構造化パターン
  - Scene 構成の設計原則（Happy path → Edge case → 運用 → セキュリティ）
  - Gap の 11 カテゴリ分類体系
  - 先輩（ナレーター）の役割設計
  - 「人間レビュー」を前提としたワークフロー設計
```

差別化の核心: **LLM プロバイダーは「AI が全部やります」と売りたい。DGE は「AI は会話劇を書くだけ。判断は人間がする」と言っている。** この哲学の違いは機能で埋められない。

#### B. キャラクター設計の深さ（文化圏別アーキタイプ）

DGE のキャラクターは単なる「ペルソナ」ではない:

- **5 Types の問い**との対応関係がある（今泉 = Type 1-5 全般、千石 = 品質観点、ヤン = Type 2 本質抽出）
- **組み合わせ理論**がある（構築者 vs 破壊者のバランス、最低 3 名・最大 5 名）
- **文化圏別マッピング**がある（三国志、西洋文学、インド神話など）
- **カスタムキャラクター作成ガイド**がある

LLM プロバイダーは汎用的な「厳しいレビュアー」「楽観的な提案者」程度のペルソナしか提供しない。DGE の 12 キャラクター体系と使い分けガイドは、実践から生まれた深さを持つ。

#### C. 会話劇 → Gap → Spec の構造化プロセス

DGE の 3 ステップ（Generate → Extract → Specify）は、各ステップに明示的なフォーマットと品質基準がある:

- Gap マーキングのルール（`→ Gap 発見:` の即時挿入）
- Gap → Use Case / API / Data Model への変換テンプレート
- Scene 構成の 4 幕構造

LLM プロバイダーの内蔵機能は「結果」を出力するが、「プロセス」を可視化しない。DGE はプロセスが可視的であることに価値がある。

#### D. 人間レビューを前提とした設計

```
LLM プロバイダーの設計思想:
  「AI がレビューを完了しました。問題は 5 件です。」
  → 人間は結果を受け取るだけ

DGE の設計思想:
  「会話劇を書きました。人間が読んでレビューしてください。」
  → 人間が会話劇を読む過程で、AI が見落とした gap に気づく
  → unlaxer-parser: 108 gaps のうち人間レビューで追加発見あり
  → AskOS: 85 gaps のうち 22% が人間レビュー中に発見
```

この「人間レビューで 22% 追加発見」という数字が、DGE が「AI 完結型」と本質的に異なることの証拠。

### 1.3 ポジショニング

**DGE は「LLM のプロンプト技法」ではなく「設計レビュー方法論」である。**

比喩で説明する:

```
スクラムは Jira に内蔵されたか？ → No。Jira はスクラムを支援するツール。
テスト駆動開発は IDE に内蔵されたか？ → No。IDE はテストの実行を支援する。
コードレビューは GitHub に内蔵されたか？ → Yes、だが「レビューの方法論」は別に存在する。

DGE は:
  LLM プロバイダーが「設計レビュー機能」を内蔵する → ツールが増える
  DGE は「その機能をどう使うか」の方法論 → 方法論は別レイヤー
```

LLM プロバイダーが設計レビュー機能を内蔵することは、DGE の脅威ではなく**市場の立ち上げ**。「AI で設計レビューできる」という認知が広がった後に、「どうやれば効果的か」の方法論として DGE が参照される。

### 1.4 実際の対策

#### 対策 1: 学術的権威で先行者利得を確保（進行中）

```
現状:
  - ICSE 2027 SEIP Accepted（査読済み、camera-ready 完了）
  - 「DGE」という用語の定義者としてのポジション確立済み

次のアクション:
  - 論文の被引用を増やす → 他研究者に DGE を引用してもらう
  - follow-up 論文: 比較実験の大規模版（3 名 → 30 名以上）
  - DGE を引用した事例報告の奨励
```

#### 対策 2: コミュニティ・事例の蓄積

```
方法論の価値はコミュニティの厚みで決まる。

アクション:
  - DGE 実践事例のテンプレート化（session log の公開形式を標準化）
  - 文化圏別キャラクターカタログの crowdsource
  - 「DGE やってみた」系の発表・ブログの奨励
  - 企業での適用事例を 3 件以上集める（unlaxer-parser, AskOS 以外）
```

#### 対策 3: LLM プロバイダーとの共存戦略

```
対立シナリオ（避けるべき）:
  「うちの DGE toolkit を使ってください」vs「Claude の内蔵機能で十分です」

共存シナリオ（目指すべき）:
  Claude の設計レビュー機能が DGE の方法論に準拠している
  → 「Powered by DGE methodology」的な位置づけ

具体的アプローチ:
  - Anthropic, OpenAI, Google の Developer Relations チームに論文を共有
  - 「設計レビュー機能を作るなら DGE を参考にしてほしい」と提案
  - DGE toolkit を各プラットフォームの拡張として提供
    (Claude skills, GPT Actions, Gemini Extensions)
  - 方法論のライセンスは MIT のまま → 採用障壁を下げる
```

#### 対策 4: DGE の進化を止めない

```
LLM プロバイダーが追いつく速度より速く進化する:

  現在の DGE (v1):
    会話劇 → Gap → Spec

  次世代 DGE (v2) の候補:
    - Gap の自動追跡（outcome tracking）← Part 2 で定義
    - Session 間の gap 連鎖分析
    - チーム固有のキャラクターライブラリ蓄積
    - Gap 発見パターンの統計分析
    - プロジェクトのフェーズに応じたキャラクター自動推薦

  これらは「1 回の API 呼び出し」では実装できない。
  継続的な方法論の進化が moat になる。
```

### 1.5 プラットフォームリスクの結論

```
正直な評価:
  - 「会話劇で設計レビュー」の機能は 1 年以内に commodity 化する
  - DGE toolkit 単体の競争力は低下する
  - ただし DGE の「方法論としての深さ」は容易にコピーできない

防御可能なもの:
  ✓ 学術的権威（ICSE 論文、用語の定義者）
  ✓ 方法論の体系（今泉メソッド、Scene 構成、Gap 分類）
  ✓ 人間レビュー前提の設計哲学
  ✓ 実践事例の蓄積
  ✓ コミュニティ

防御できないもの:
  ✗ 会話劇生成という「機能」
  ✗ キャラクターベースのペルソナという「アイデア」
  ✗ Gap 抽出の「自動化」

戦略の要約:
  機能で戦わない。方法論で戦う。
  ツールを売らない。ベストプラクティスを広める。
  LLM プロバイダーと対立しない。DGE が業界標準になる未来を作る。
```

---

## Part 2: Gap-問題相関の分析フレームワーク

### 2.1 問題の定義

DGE は gap を大量に発見する（unlaxer-parser: 108, AskOS: 85, Meta: 71）。しかし:

- 発見された gap のうち、何個が**実際にクリティカルな問題**だったのか？
- 「面白い指摘」と「本当に直すべき問題」の区別ができているのか？
- DGE は「問題を見つけた気分」を売っているだけではないか？

Session 003 の Red Team の指摘は正鋭:
> 「DGE session は『盛り上がる』。キャラクター同士が議論して、gap が次々出てくる。チームは知的な充実感を得る。Entertainment value と analytical value を混同するリスクだ。」

### 2.2 Retrospective Analysis: unlaxer-parser の 108 gaps

#### 既知のデータ

```
プロジェクト: unlaxer-parser（SLE 2026 → ICSE 2027 SEIP で引用）
規模: production parser framework, 10^9 transactions/month
DGE sessions: 5 回
発見 gaps: 108
false positive rate: 6%（ICSE 論文記載）
```

#### 分析すべき項目

| 項目 | 質問 | データソース |
|------|------|------------|
| **True positive rate** | 108 gaps のうち false positive 6% = 約 6.5 件が偽陽性。残り 101.5 件は true positive か？ | ICSE 論文 Section 5 |
| **実装率** | 101 件の true positive のうち、何件が実装に反映されたか？ | unlaxer-parser の commit log / issue tracker |
| **Severity 分布** | 実装された gap のうち、Critical / High / Medium / Low の分布は？ | 実装の diff サイズ、影響範囲で推定 |
| **発見タイミング** | DGE なしでも発見されていた gap はどれか？ | 開発者へのヒアリング |
| **見逃し（偽陰性）** | DGE 後に発見された問題で、DGE で見つかるべきだったものはあるか？ | 本番障害ログ、post-mortem |

#### 今すぐ実施可能な分析

```
1. unlaxer-parser リポジトリの commit log を取得
2. 各 commit message / PR description に DGE gap ID への言及があるか検索
3. DGE session 後に作成された issue のうち、gap と対応するものを特定
4. 対応表を作成:
   Gap ID → Commit/Issue → Outcome (Implemented / Deferred / Rejected / ...)
```

### 2.3 Retrospective Analysis: AskOS の 16 gaps（Adversarial Review）

#### 既知のデータ

```
プロジェクト: AskOS（AI agent orchestration platform）
DGE sessions: 11+ 回（うち adversarial review で 16 gaps）
全体: 85 gaps、14,978 行の設計ドキュメント
人間レビュー中の追加発見: 22%
```

#### AskOS 16 gaps の事後追跡

| Gap カテゴリ | Gap 内容 | Outcome | 追跡方法 |
|-------------|---------|---------|----------|
| ビジネス | 効果測定なし | **要追跡** | KPI ダッシュボードの有無を確認 |
| ビジネス | 運用未設計 | **要追跡** | runbook の存在を確認 |
| ビジネス | 大手参入リスク | **要追跡** | 競合分析ドキュメントの有無 |
| ビジネス | GTM なし | **要追跡** | GTM 戦略ドキュメントの有無 |
| ビジネス | pricing 未検証 | **要追跡** | pricing 実験の実施有無 |
| 安全性 | auto-answer timing gap | **要追跡** | 実装の timing logic を確認 |
| 安全性 | Decision 質の可視化なし | **要追跡** | UI に品質指標があるか |
| 安全性 | de-anonymization | **要追跡** | データ処理パイプラインの確認 |
| 安全性 | SPOF | **要追跡** | アーキテクチャの冗長性確認 |
| 運用 | runbook ゼロ | **要追跡** | runbook の存在確認 |
| 運用 | OSS 品質検証なし | **要追跡** | 依存パッケージの audit 有無 |
| 運用 | SLA 未定義 | **要追跡** | SLA ドキュメントの有無 |
| メッセージ | ユーザー目線の語り方 | **要追跡** | LP / マーケティング資料の変更有無 |
| メッセージ | LP ヘッドライン | **要追跡** | LP の現在のコピーを確認 |
| 法的 | 利用規約なし | **要追跡** | ToS の存在確認 |
| 法的 | compliance positioning | **要追跡** | compliance 関連ドキュメントの有無 |

**最優先アクション**: AskOS の現在の状態と上記 16 gaps を突合し、各 gap の outcome を記録する。

### 2.4 Gap Outcome Categories

今後すべての DGE session で gap の追跡に使用するカテゴリ:

| Category | 定義 | 記号 |
|----------|------|------|
| **Implemented** | gap に対応する変更が実装された | `[IMPL]` |
| **Deferred** | 認識されたが意図的に先送りされた（理由を記録） | `[DEF]` |
| **Rejected** | 検討の結果、対応不要と判断された（理由を記録） | `[REJ]` |
| **Duplicate** | 他の gap と実質的に同じ問題を指摘していた | `[DUP]` |
| **Unknown** | 追跡不能（対応する issue/commit が見つからない） | `[UNK]` |

サブカテゴリ（Implemented の場合）:

| Sub-category | 定義 |
|-------------|------|
| **Impl-Critical** | この gap が発見されなければ本番障害に繋がっていた |
| **Impl-Important** | 品質・UX に有意な改善をもたらした |
| **Impl-Minor** | 改善はしたが影響は小さかった |

### 2.5 分析テンプレート: Gap Outcome Tracking Sheet

以下のフォーマットを各 DGE session の成果物に追加する。session 実施時に Gap 列を埋め、1 週間後・1 ヶ月後・3 ヶ月後に Outcome 列を更新する。

```markdown
# Gap Outcome Tracking

| # | Gap | Category | Severity | Outcome | Outcome Date | Notes |
|---|-----|----------|----------|---------|-------------|-------|
| 001 | [gap の内容] | Missing logic | High | [IMPL] Impl-Critical | 2026-04-15 | commit abc123 で修正 |
| 002 | [gap の内容] | Spec-impl mismatch | Medium | [DEF] v2 で対応予定 | 2026-04-01 | issue #42 |
| 003 | [gap の内容] | Business gap | High | [REJ] 市場調査の結果不要 | 2026-04-20 | 調査レポート参照 |
| ... | ... | ... | ... | ... | ... | ... |

## Tracking Schedule
- [ ] 1 週間後レビュー (YYYY-MM-DD)
- [ ] 1 ヶ月後レビュー (YYYY-MM-DD)
- [ ] 3 ヶ月後レビュー (YYYY-MM-DD)

## Summary Metrics
- Total gaps: N
- Implemented: N (Critical: N, Important: N, Minor: N)
- Deferred: N
- Rejected: N
- Duplicate: N
- Unknown: N
- **Precision (実装率)**: Implemented / (Total - Duplicate) = N%
- **Critical hit rate**: Impl-Critical / Total = N%
```

### 2.6 相関分析の実施計画

#### Phase 1: 既存データの retrospective 分析（即時実施可能）

```
対象: unlaxer-parser (108 gaps), AskOS (16 gaps from adversarial review)
方法:
  1. 各プロジェクトの issue tracker / commit log を走査
  2. Gap Outcome Tracking Sheet を埋める
  3. Precision（実装率）と Critical hit rate を算出
期間: 1-2 週間
成果物: 各プロジェクトの Gap Outcome Tracking Sheet
```

#### Phase 2: Meta DGE の 71 gaps の追跡（進行中）

```
対象: DGE-toolkit 自身の 71 gaps（session 001-003）
方法:
  1. 本文書（strategy.md）自体が 3-019 と 3-007 への対応
  2. 各 gap に対するアクションを tracking sheet で管理
  3. 3 ヶ月後に outcome を評価
```

#### Phase 3: 新規 session での prospective tracking（今後のすべての session）

```
ルール:
  - すべての新規 DGE session に Gap Outcome Tracking Sheet を添付する
  - session 実施時に Gap と Severity を記録
  - 1 週間後・1 ヶ月後・3 ヶ月後に Outcome を更新
  - 四半期ごとに全 session の集計レポートを作成
```

#### Phase 4: 統計的検証（データ蓄積後）

```
目標: 以下の問いに定量的に答える

Q1: DGE の Precision（発見 gap の実装率）はどの程度か？
  → 目標: 60% 以上（偽陽性率 40% 以下）

Q2: DGE の Critical hit rate はどの程度か？
  → 目標: 10% 以上（10 件の gap のうち 1 件以上が Critical）

Q3: Gap カテゴリごとの Precision に差はあるか？
  → 仮説: Missing logic > Business gap（技術的 gap の方が precision 高い）

Q4: キャラクターごとの Precision に差はあるか？
  → 仮説: 今泉（前提検証）の gap は precision が高い

Q5: DGE なしで発見されていた gap の割合は？
  → ICSE 論文の controlled study では DGE が 2.4x → 約 58% は DGE 固有の発見

必要サンプル数: 最低 5 プロジェクト、300+ gaps の tracking data
```

### 2.7 ICSE 論文データとの接続

ICSE 2027 SEIP 論文には以下のデータが既にある:

```
- false positive rate: 6%（unlaxer-parser）
- controlled study: DGE は 2.4x more gaps, 2.0x more gap types
- 人間レビューでの追加発見: 22%（AskOS）
- Cohen's κ = 0.71（inter-rater agreement）
```

これらと Gap Outcome Tracking のデータを組み合わせることで、follow-up 論文が書ける:

```
タイトル案:
  "From Gaps to Fixes: Tracking the Outcome of DGE-Discovered Design Gaps"

主張:
  DGE で発見された gap の X% が実装に反映され、
  そのうち Y% が Critical な問題の早期発見であった。
  Gap Outcome Tracking は DGE の有効性を継続的に検証する
  フレームワークとして機能する。
```

### 2.8 Gap-問題相関の結論

```
現状の正直な評価:
  - DGE が gap を発見することは実証済み（108 + 85 + 71 = 264 gaps）
  - しかし「発見された gap がどうなったか」の追跡はゼロ
  - これは DGE の信頼性にとって最大の弱点

即座にやるべきこと:
  1. unlaxer-parser の 108 gaps の outcome を追跡する（retrospective）
  2. AskOS の 16 gaps の outcome を追跡する（retrospective）
  3. 今後のすべての session に Gap Outcome Tracking Sheet を添付する

中期的にやるべきこと:
  4. 四半期ごとの集計レポートを作成する
  5. Precision と Critical hit rate を KPI として公開する

長期的にやるべきこと:
  6. 5 プロジェクト以上のデータで統計的検証を行う
  7. follow-up 論文を書く
```

---

## Appendix: 本文書自体の Gap Outcome Tracking

| # | 対象 Gap | Outcome | Notes |
|---|---------|---------|-------|
| 3-019 | LLM プロバイダーのプラットフォームリスク | [IMPL] Part 1 で分析・対策を記述 | 本文書 |
| 3-007 | Gap-問題相関の未検証 | [IMPL] Part 2 で分析フレームワークを定義 | 本文書。ただしフレームワーク定義のみ。実データの追跡は Phase 1 で実施 |

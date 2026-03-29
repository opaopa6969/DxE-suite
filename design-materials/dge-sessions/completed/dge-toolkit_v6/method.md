# DGE Method — Design-Gap Exploration / Dialogue-driven Gap Extraction

## 名前の由来

DGE は 2 つの意味を同時に持つ:

```
Design-Gap Exploration     — 設計の穴を探索する（目的）
Dialogue-driven Gap Extraction — 対話で穴を抽出する（手法）
```

unlaxer-parser (SLE 2026) では前者として定義され、
AskOS の設計 session で後者に進化した。
どちらも正しい。設計の穴を対話で見つける。

## 原理

仕様書のレビューは「書いてあることの検証」。
DGE は「書いてないことの発見」。

ユーザーが実際に使う場面をキャラクターでシミュレーションすると、
仕様書にない前提、暗黙の制約、考慮漏れが表面化する。

## DGE の 3 ステップ

```
Step 1: 会話劇を書く (Generate)
  テーマとキャラクターを決めて、
  そのキャラクターたちが議論する会話劇を生成する。
  
Step 2: Gap を抽出する (Extract)
  会話劇の中から「未定義」「矛盾」「考慮漏れ」を
  Gap として抽出する。

Step 3: Spec に落とす (Specify)
  各 Gap を Use Case, API, Data Model に変換する。
```

## 会話劇の書き方

### 形式

```
先輩 (ナレーション): 技術的背景を中立に説明する。
  キャラクターが議論に入るための context を提供。

キャラA: 「セリフ」
  → Gap 発見: 〇〇が未定義

キャラB: 「セリフ」
  → Gap 発見: △△と□□が矛盾

キャラC: 「セリフ」
  → Spec implication: ×× の API が必要
```

### 役割: 先輩（ナレーション）

unlaxer-parser の DGE session で発見された追加役割。

```
先輩は技術的背景を neutral に語る narrator。
キャラクターではなく「状況設定」の役割。

例:
  先輩: 「production 文法と complete 文法の差分をマージする。
        complete 文法では BooleanExpression が 3 階層になっている。
        production の BooleanExpression はフラットな Choice だから、
        これを置き換える必要がある。」
  
  → この context があることで、キャラクターが
    「そもそもその階層化って必要？」（今泉）
    「3 階層は正しい設計」（千石）
    と議論に入れる。

先輩がいない場合:
  キャラクターが背景説明から始めなければならない。
  これはキャラの personality に合わない。
  今泉が技術的背景を説明するのは不自然。

先輩がいる場合:
  背景 → 議論の分離が明確。
  キャラクターは自分の role に集中できる。
```

### ルール

1. **正解を出さない** — キャラクターは問題を提起するだけ。解決は human。
2. **全員に発言させる** — 1 キャラだけが話す会話劇は DGE にならない。
3. **矛盾を歓迎する** — キャラクター間の矛盾が最も価値のある Gap。
4. **具体的な場面を描く** — 抽象的な議論ではなく「ユーザーが〇〇したとき」。
5. **Gap を即座にマークする** — 会話の流れの中で `→ Gap 発見:` を挿入。
6. **先輩が context を設定する** — 技術的背景は先輩が語り、キャラは議論に集中。

### Scene の構成

```
Scene 1: 基本フロー (Happy path)
  先輩が背景を説明 → キャラが議論 → Gap 発見
  
Scene 2: エッジケース
  先輩が boundary を説明 → キャラが攻撃 → Gap 発見
  
Scene 3: 運用 / パフォーマンス
  先輩が制約を説明 → キャラがトレードオフを議論 → Gap 発見
  
Scene 4: セキュリティ / リスク
  先輩が脅威モデルを説明 → Red Team + ハウスが攻撃 → Gap 発見
```

## Observe → Suggest → Act パターン

全ての Gap は以下の構造を持つ:

```
Observe: 「〇〇が定義されていない」(現状の問題)
Suggest: 「△△を追加すべき」(提案)
Act:     UC-XX, API endpoint, Data Model (具体的な仕様)
```

## Gap の分類（6 カテゴリ）

unlaxer-parser の DGE で確立された分類:

| Category | 内容 | 例 |
|----------|------|-----|
| Missing logic | 実装が足りない | 関数が未実装 |
| Spec-impl mismatch | 仕様と実装のズレ | parser は通るが evaluator が落ちる |
| Type/coercion gap | 型変換の考慮漏れ | toNum("3.14") が String を返す |
| Error quality | エラーメッセージが不親切 | "parse failed" だけ |
| Integration gap | 連携部分の不整合 | LSP が補完候補を出さない |
| Test coverage | テストの欠落 | variadic 関数のテストがない |

AskOS の DGE で追加された分類:

| Category | 内容 | 例 |
|----------|------|-----|
| Business gap | ビジネスモデルの穴 | 効果測定指標がない |
| Safety gap | 安全性の欠陥 | auto-answer の依存症 |
| Ops gap | 運用の欠如 | runbook がゼロ |
| Message gap | 伝え方の問題 | ユーザーの言葉で語れてない |
| Legal gap | 法的リスク | 利用規約がない |

## Spec への落とし方

### Use Case

```
UC-XXX-01: [タイトル]
  Trigger: [何がきっかけで発動するか]
  Input:   [何が入力されるか]
  Output:  [何が出力されるか]
  API:     [対応する API endpoint]
```

### API Endpoint

```
METHOD /api/path
  Body:     { field: type }
  Response: { field: type }
```

### Data Model

```sql
CREATE TABLE ... / ALTER TABLE ...
```

## 今泉メソッド — 5 Types の問い

DGE の最も強力な武器:

```
Type 1: 「そもそも」— 前提の検証
Type 2: 「要するに」— 本質の抽出
Type 3: 「他にないの」— 選択肢の拡張
Type 4: 「誰が困るの」— 影響の具体化
Type 5: 「前もそうだった」— 過去の参照
```

## レビューフロー

```
1. 会話劇を書く (10-30分)
2. 人間がレビューする (5-10分) ← ★ここが本質
3. レビューで出た追加の気づきを反映
4. Spec に落とす
```

会話劇 → レビュー の往復が DGE の核心。
レビューなしの会話劇は片手落ち。

## DGE の適用範囲

```
論文版 (unlaxer-parser):
  パーサー文法設計、型システム、言語機能の設計
  → 仕様 vs 実装の gap

汎用版 (AskOS session):
  API 設計、プロダクト設計、ビジネス戦略、採用、投資判断
  → 設計の穴すべて

共通:
  「キャラクターが議論する会話劇で gap を発見する」
  テーマを問わない。キャラの組み合わせで角度が変わる。
```

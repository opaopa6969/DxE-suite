# DGE 有効性検証 — 比較実験デザイン

> Critical gaps 1-007, 1-008 への対応。
> 「DGE は単純プロンプトより本当に優れているのか？」を定量的に検証する。

---

## 1. 実験の目的

DGE（キャラクター会話劇による gap 抽出）が、以下の既存手法と比較して
**設計の gap 発見において有効かどうか**を定量的に検証する。

検証したい仮説:

```
H1: DGE は単純プロンプトより多くのユニーク gap を発見する
H2: DGE はチェックリストベースレビューより severity の高い gap を発見する
H3: DGE + 人間レビューは DGE 単体より precision が高い
H4: DGE は所要時間あたりの有用 gap 発見数（効率）で他手法を上回る
```

---

## 2. 実験デザイン

### 2.1 条件（4 条件 × 3 対象 = 12 セル）

| 条件 | 手法 | プロンプト例 | 人間の介入 |
|------|------|-------------|-----------|
| **A: 単純プロンプト** | 「この設計の問題点を指摘して」と LLM に投げる | 下記参照 | なし |
| **B: チェックリスト** | STRIDE / OWASP / RFC 2119 等の既知フレームワークで LLM にレビューさせる | 下記参照 | なし |
| **C: DGE** | DGE テンプレートでキャラクター会話劇を生成 | テンプレート使用 | なし |
| **D: DGE + 人間レビュー** | DGE 生成後、人間が 10 分レビューして追記 | テンプレート使用 | あり（10分） |

### 2.2 各条件のプロンプト

**条件 A: 単純プロンプト**
```
以下の設計ドキュメントを読んで、問題点、考慮漏れ、矛盾を指摘してください。
各問題に severity (Critical / High / Medium / Low) をつけてください。

[設計ドキュメント全文]
```

**条件 B: チェックリストベースレビュー**
```
以下の設計ドキュメントを、下記のチェックリストに基づいてレビューしてください。

## チェックリスト
- [ ] 全ての入力に対するバリデーションが定義されているか
- [ ] エラーケースのハンドリングが網羅されているか
- [ ] 認証・認可のフローが明示されているか (STRIDE: Spoofing)
- [ ] データの改竄防止策が定義されているか (STRIDE: Tampering)
- [ ] 監査ログ・否認防止策があるか (STRIDE: Repudiation)
- [ ] 情報漏洩のリスクが評価されているか (STRIDE: Information Disclosure)
- [ ] DoS / リソース枯渇への対策があるか (STRIDE: Denial of Service)
- [ ] 権限昇格のリスクが評価されているか (STRIDE: Elevation of Privilege)
- [ ] パフォーマンス要件（レイテンシ、スループット）が定義されているか
- [ ] 後方互換性・マイグレーション戦略があるか
- [ ] 運用監視・アラートの設計があるか
- [ ] ユーザーの行動シナリオがカバーされているか

各項目について問題があれば指摘してください。severity つき。

[設計ドキュメント全文]
```

**条件 C / D: DGE**
```
DGE テンプレート（api-design.md / feature-planning.md / security-review.md）を
そのまま使用。キャラクター選択はテンプレートの推奨に従う。
```

### 2.3 対象ドキュメント（3 種類）

実験の信頼性を上げるため、**既知の問題が事前に埋め込まれた**設計ドキュメントを使う。

| # | 対象 | テンプレート | 既知の問題数 | 作成方法 |
|---|------|-------------|-------------|---------|
| D1 | REST API 設計（認証 + CRUD） | api-design.md | 15 個 | 下記参照 |
| D2 | 新機能企画（通知システム） | feature-planning.md | 15 個 | 下記参照 |
| D3 | セキュリティ設計（OAuth フロー） | security-review.md | 15 個 | 下記参照 |

**既知の問題の埋め込み方法:**

1. まず「完璧な設計ドキュメント」を作成する
2. 以下の 5 カテゴリから各 3 個、計 15 個の問題を意図的に埋め込む:
   - Missing logic（3 個）: API のエッジケース未定義、エラーハンドリング欠落等
   - Spec-impl mismatch（3 個）: 記述の矛盾、型の不整合等
   - Integration gap（3 個）: 連携部分の考慮漏れ等
   - Security gap（3 個）: 認証バイパス、情報漏洩経路等
   - Ops gap（3 個）: 監視未設計、リカバリ手順なし等
3. 埋め込んだ問題リストは sealed answer（正解ラベル）として保管する

> **なぜ合成ドキュメントか**: 既存プロジェクトのドキュメントでは「真の問題一覧」が不明なため
> precision / recall を計算できない。合成ドキュメントなら正解ラベルがある。

### 2.4 制御変数

| 変数 | 統制方法 |
|------|---------|
| LLM | 全条件で同一モデル・同一パラメータ（Claude Sonnet 4, temperature 0） |
| ドキュメント | 全条件に同一ドキュメントを使用 |
| 繰り返し | 各セル 5 回実行（LLM の出力ばらつきを測定） |
| 順序効果 | 条件 A→B→C の順序はランダム化（実際は独立実行なので問題なし） |
| DGE キャラ | テンプレート推奨の組み合わせを固定使用 |
| 条件 D の人間 | 同一人物（著者）が全セッションをレビュー |

---

## 3. 測定指標

### 3.1 主要指標

| 指標 | 定義 | 計算方法 |
|------|------|---------|
| **Gap 発見数** | 条件ごとに発見された gap の総数 | 出力から手動カウント |
| **ユニーク率** | 重複を除いた gap の割合 | ユニーク gap 数 / 総 gap 数 |
| **Severity 分布** | Critical / High / Medium / Low の比率 | 著者が blind 判定 |
| **Precision** | 発見 gap のうち、実際に有用だった割合 | 有用 gap 数 / 発見 gap 数 |
| **Recall** | 埋め込み済み問題のうち、発見できた割合 | 発見済み既知問題数 / 15 |
| **所要時間** | gap 抽出完了までの時間（秒） | LLM 応答時間 + 人間レビュー時間 |
| **効率** | 時間あたりの有用 gap 数 | 有用 gap 数 / 所要時間（分） |

### 3.2 Gap の「有用」判定基準

著者が各 gap に対して以下の 3 段階で判定する:

```
Useful    — この gap を知ったことで設計を変更する/変更すべき
Marginal  — 指摘は正しいが設計変更には至らない
Noise     — 誤り、既に対処済み、またはトリビアル
```

Precision 計算では `Useful` のみをカウントする。

### 3.3 Gap の重複判定

同一の問題を指しているかの判定基準:

```
同一: 同じ箇所の同じ問題を異なる表現で指摘している
類似: 関連するが別の側面を指摘している → 別 gap としてカウント
無関係: 別の問題 → 別 gap
```

判定は著者が行い、判断に迷う場合は「別 gap」として寛容にカウントする。

---

## 4. 統計的検定

### 4.1 検定手法

| 比較 | 検定 | 理由 |
|------|------|------|
| 4 条件間の gap 発見数 | Friedman 検定 | 対応あり（同一ドキュメント）、正規性が仮定できない、サンプルサイズ小 |
| 事後比較（条件ペア） | Wilcoxon 符号順位検定 + Bonferroni 補正 | ノンパラメトリック、多重比較補正 |
| Precision / Recall | Fisher 正確確率検定 | 2×2 の分割表、期待度数が 5 未満のセルが生じうる |
| Severity 分布 | Chi-squared 検定（期待度数 ≥ 5 の場合）/ Fisher 正確確率検定 | カテゴリカルデータ |

### 4.2 サンプルサイズの根拠

```
セル数:     4 条件 × 3 ドキュメント × 5 回 = 60 実行
比較単位:   条件あたり 15 データポイント（3 ドキュメント × 5 回）

効果量の仮定:
  - DGE が単純プロンプトより 30% 以上多くの gap を発見する（Cohen's d ≈ 0.8）
  - これは unlaxer-parser (108 gaps / 5 sessions) と AskOS (16 gaps) の
    実績から、DGE の gap 発見能力が高いことを前提とした仮定

検出力分析:
  - α = 0.05, power = 0.80, effect size = large (d = 0.8)
  - Wilcoxon 符号順位検定に必要なサンプルサイズ: n ≈ 15
  - 条件あたり 15 データポイント（3 × 5）で充足
```

> **注**: これはパイロット実験であり、大規模な統計的検出力よりも
> 「効果の方向性と大きさの推定」を重視する。信頼区間も必ず報告する。

### 4.3 有意水準

```
α = 0.05（Bonferroni 補正後: 0.05 / 6 = 0.0083 を各ペア比較に適用）
  ペア比較: A-B, A-C, A-D, B-C, B-D, C-D の 6 組
```

---

## 5. 既存データの Retrospective Analysis

新規実験だけでなく、既存の DGE セッションデータも分析に含める。

### 5.1 unlaxer-parser（108 gaps / 5 sessions）

**目的**: DGE で発見された gap が実際の実装でどうなったかを追跡する。

**手順**:

1. 108 gaps の一覧を取得する
2. 各 gap について以下を判定:
   - **Resolved**: コードまたは仕様で対処済み
   - **Acknowledged**: 認識されたが未対処（backlog）
   - **Rejected**: 検討の結果、対処不要と判断
   - **False positive**: そもそも問題ではなかった
3. Resolution rate = (Resolved + Acknowledged) / 108 を算出
4. Precision (retrospective) = (Resolved + Acknowledged + Rejected) / 108 を算出
   （False positive 以外は全て「有用な指摘」とみなす）
5. Severity ごとの resolution rate を分析

**追加分析**: unlaxer-parser の設計ドキュメントに対して条件 A（単純プロンプト）と
条件 B（チェックリスト）を事後的に適用し、DGE が発見して他手法が発見しなかった
gap（DGE-unique gaps）を特定する。

### 5.2 AskOS（16 gaps / adversarial review）

**目的**: adversarial DGE の gap 品質を検証する。

**手順**:

1. 16 gaps の一覧を取得する
2. 各 gap について以下を判定:
   - **Resolved**: 設計または実装で対処済み
   - **Acknowledged**: 認識されたが未対処
   - **Rejected**: 対処不要
   - **False positive**: 問題ではなかった
3. AskOS の設計ドキュメント（14,978 行）に対して条件 A, B を適用
4. 条件間の gap 発見の重複を Venn diagram で可視化

### 5.3 Retrospective の限界

```
制限事項:
  - 正解ラベルがないため recall は計算できない（合成実験と異なる）
  - 著者バイアス: DGE の開発者が判定するため有利な方向にバイアスが生じうる
  - 対処法: 判定基準を事前に明文化し、全判定結果を公開する
```

---

## 6. 実行手順

### Phase 0: 準備（1 日）

```
0-1. 合成設計ドキュメント 3 本を作成する
     - D1: REST API 設計（認証付き CRUD API）
     - D2: 新機能企画（リアルタイム通知システム）
     - D3: セキュリティ設計（OAuth 2.0 + PKCE フロー）

0-2. 各ドキュメントに 15 個の既知問題を埋め込む
     - カテゴリ配分: Missing logic × 3, Spec-impl mismatch × 3,
       Integration gap × 3, Security gap × 3, Ops gap × 3
     - 問題リストを sealed-answers.md として保管（実験完了まで非公開）

0-3. 実験環境を準備する
     - LLM: Claude Sonnet 4（API 経由、temperature = 0）
     - 実行スクリプト: 各条件のプロンプトを自動投入するシェルスクリプト
     - 記録テンプレート: 結果記録用の CSV テンプレートを用意
```

### Phase 1: Prospective Experiment（2-3 日）

```
1-1. 条件 A（単純プロンプト）を実行する
     - D1, D2, D3 × 各 5 回 = 15 回
     - 各回の出力を results/A/D{1,2,3}/run{1..5}.md に保存
     - 所要時間を記録

1-2. 条件 B（チェックリスト）を実行する
     - D1, D2, D3 × 各 5 回 = 15 回
     - 結果を results/B/D{1,2,3}/run{1..5}.md に保存
     - 所要時間を記録

1-3. 条件 C（DGE）を実行する
     - D1: api-design.md テンプレート、キャラ = 今泉 + 千石 + 僕
     - D2: feature-planning.md テンプレート、キャラ = 今泉 + ヤン + 僕
     - D3: security-review.md テンプレート、キャラ = 千石 + Red Team + ハウス
     - D1, D2, D3 × 各 5 回 = 15 回
     - 結果を results/C/D{1,2,3}/run{1..5}.md に保存

1-4. 条件 D（DGE + 人間レビュー）を実行する
     - 条件 C の出力を人間（著者）が 10 分間レビューする
     - 追加で発見した gap を赤字（追記マーク）で追記
     - D1, D2, D3 × 各 5 回 = 15 回
     - 結果を results/D/D{1,2,3}/run{1..5}.md に保存
     - 人間レビューの追加 gap 数と所要時間を記録
```

### Phase 2: Gap 判定（1 日）

```
2-1. 全出力から gap を抽出してリスト化する
     - 各 gap に一意の ID を付与: A-D1-R1-001 等
     - CSV: condition, document, run, gap_id, description, severity

2-2. Gap の有用性を blind 判定する
     - 全 gap をシャッフルし、条件ラベルを隠して判定
     - 判定: Useful / Marginal / Noise

2-3. 既知問題との照合（Recall 計算）
     - sealed-answers.md を開封
     - 各既知問題について「発見された/されなかった」を記録

2-4. 重複判定
     - 条件間で同一の gap を指しているものを統合
     - ユニーク gap 数を算出
```

### Phase 3: Retrospective Analysis（1 日）

```
3-1. unlaxer-parser の 108 gaps を resolution 判定する
     - git log / issue tracker と照合

3-2. unlaxer-parser の設計ドキュメントに条件 A, B を適用する
     - 各 5 回実行
     - DGE-unique gaps を特定

3-3. AskOS の 16 gaps を resolution 判定する

3-4. AskOS の設計ドキュメントに条件 A, B を適用する
     - 各 5 回実行
     - 条件間の Venn diagram を作成
```

### Phase 4: 統計分析・レポート（1 日）

```
4-1. 条件ごとの記述統計を算出
     - gap 発見数（平均, 中央値, SD）
     - ユニーク率, severity 分布
     - precision, recall
     - 所要時間, 効率

4-2. 統計検定を実行
     - Friedman 検定 → 有意なら Wilcoxon + Bonferroni
     - 効果量（r = Z / √N）と 95% 信頼区間を報告

4-3. Retrospective の結果をまとめる
     - Resolution rate, precision
     - DGE-unique gaps の特徴分析

4-4. レポートを paper/experiment-results.md に書く
```

---

## 7. 想定される結果のパターンと解釈

実験結果の解釈を事前に決めておく（p-hacking 防止）。

| パターン | 解釈 | アクション |
|---------|------|-----------|
| C > A, C > B（gap 数、precision ともに有意差あり） | DGE は既存手法より有効 | 論文で主張可能 |
| C > A, C ≈ B（チェックリストとは差なし） | DGE はチェックリストと同等だがプロンプトよりは有効 | DGE の利点を「チェックリスト不要で同等品質」と再定義 |
| C ≈ A, C ≈ B（差なし） | DGE の付加価値は統計的に示せない | method.md を修正。定性的な利点（読みやすさ等）に主張を切り替え |
| D > C（人間レビューで有意に改善） | 人間レビューが不可欠 | レビューフローを必須として強調 |
| D ≈ C（人間レビューで改善なし） | LLM 単体で十分 | レビューフローの位置づけを再考 |

---

## 8. 実行スクリプトのひな形

```bash
#!/bin/bash
# run-experiment.sh — DGE 比較実験の自動実行

MODEL="claude-sonnet-4-20250514"
RESULTS_DIR="paper/experiment/results"

for doc in D1 D2 D3; do
  for run in $(seq 1 5); do
    echo "=== Condition A: $doc Run $run ==="
    mkdir -p "$RESULTS_DIR/A/$doc"

    # 条件 A: 単純プロンプト
    cat <<PROMPT | claude-api --model "$MODEL" --temperature 0 > "$RESULTS_DIR/A/$doc/run${run}.md"
以下の設計ドキュメントを読んで、問題点、考慮漏れ、矛盾を指摘してください。
各問題に severity (Critical / High / Medium / Low) をつけてください。

$(cat "paper/experiment/docs/${doc}.md")
PROMPT

    echo "=== Condition B: $doc Run $run ==="
    mkdir -p "$RESULTS_DIR/B/$doc"

    # 条件 B: チェックリスト
    cat <<PROMPT | claude-api --model "$MODEL" --temperature 0 > "$RESULTS_DIR/B/$doc/run${run}.md"
以下の設計ドキュメントを、下記のチェックリストに基づいてレビューしてください。
[チェックリスト全文を挿入]

$(cat "paper/experiment/docs/${doc}.md")
PROMPT

    echo "=== Condition C: $doc Run $run ==="
    mkdir -p "$RESULTS_DIR/C/$doc"

    # 条件 C: DGE（Claude Code 経由で DGE テンプレートを実行）
    # 注: DGE は Claude Code の skill として実行するため、
    #     API 直叩きではなくインタラクティブに実行する。
    #     ここでは結果の保存先だけ準備。
    echo "DGE session を手動実行 → $RESULTS_DIR/C/$doc/run${run}.md に保存"

  done
done
```

---

## 9. 結果記録テンプレート

### gap-log.csv

```csv
condition,document,run,gap_id,description,severity,useful,matches_known_problem,known_problem_id,time_seconds
A,D1,1,A-D1-R1-001,"認証トークンの有効期限が未定義",High,Useful,yes,KP-D1-007,45
A,D1,1,A-D1-R1-002,"エラーレスポンスのフォーマットが不統一",Medium,Marginal,no,,45
...
```

### summary.csv

```csv
condition,document,total_gaps,unique_gaps,useful_gaps,noise_gaps,recall,precision,time_seconds
A,D1,12.4,10.2,7.8,2.0,0.40,0.63,45
B,D1,15.6,13.0,9.2,1.4,0.53,0.59,52
C,D1,18.2,16.4,12.0,1.8,0.60,0.66,180
D,D1,21.0,18.8,15.2,1.2,0.73,0.72,780
...
```

> 上記の数値はフォーマット例。実際の値は実験で決まる。

---

## 10. タイムライン

```
Day 1: Phase 0 — 合成ドキュメント作成 + 問題埋め込み
Day 2: Phase 1 前半 — 条件 A, B を実行（自動化可能）
Day 3: Phase 1 後半 — 条件 C, D を実行（DGE は手動介入あり）
Day 4: Phase 2 — Gap 判定（blind 判定）
Day 5: Phase 3 — Retrospective analysis
Day 6: Phase 4 — 統計分析 + レポート作成
```

合計: **約 6 日**（1 人で実行可能）

---

## 11. 脅威と限界（Threats to Validity）

| 脅威 | カテゴリ | 緩和策 |
|------|---------|--------|
| 著者バイアス（DGE 開発者が判定） | Internal | Blind 判定、判定基準の事前定義、全データ公開 |
| 合成ドキュメントが実プロジェクトを代表しない | External | Retrospective analysis で実プロジェクトもカバー |
| LLM のバージョン依存 | External | モデル名・バージョン・日付を記録。将来の再現用 |
| 単一の判定者 | Internal | 判断に迷った場合のルールを事前に明文化 |
| temperature 0 でも出力が揺れる | Internal | 各セル 5 回繰り返しで分散を測定 |
| DGE テンプレート自体の品質差 | Construct | テンプレートは既存のものをそのまま使用（最適化しない） |
| チェックリストの網羅性 | Construct | STRIDE + 汎用チェックリストの標準的な組み合わせを採用 |

---

## 12. 成果物一覧

実験完了後に公開するファイル:

```
paper/experiment/
├── docs/
│   ├── D1-api-design.md          # 合成ドキュメント
│   ├── D2-feature-planning.md
│   └── D3-security-review.md
├── sealed-answers.md              # 既知問題リスト（実験後に公開）
├── results/
│   ├── A/D{1,2,3}/run{1..5}.md   # 条件 A の生出力
│   ├── B/D{1,2,3}/run{1..5}.md   # 条件 B の生出力
│   ├── C/D{1,2,3}/run{1..5}.md   # 条件 C の生出力
│   └── D/D{1,2,3}/run{1..5}.md   # 条件 D の生出力
├── gap-log.csv                    # 全 gap の判定結果
├── summary.csv                    # 条件×ドキュメントの集計
├── retrospective/
│   ├── unlaxer-108-resolution.csv # unlaxer gap の resolution 判定
│   ├── unlaxer-baseline-A.md      # 条件 A を unlaxer に適用した結果
│   ├── unlaxer-baseline-B.md      # 条件 B を unlaxer に適用した結果
│   ├── askos-16-resolution.csv    # AskOS gap の resolution 判定
│   ├── askos-baseline-A.md
│   └── askos-baseline-B.md
├── analysis.py                    # 統計分析スクリプト
└── experiment-results.md          # 最終レポート
```

# DGE Session: 自動反復モード + v2 マージ統合設計

- **日付**: 2026-03-29
- **テーマ**: DGE の自動反復モード（深掘り→実装の自動遷移）の設計 + v2 マージとの統合
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル
- **テンプレート**: feature-planning.md ベース

---

## 自動反復モード仕様

### Trigger
- 「実装できるまで回して」「深掘りしてから実装」「収束するまで」「auto」

### 収束判定
- 新規 Critical/High Gap が 0 件 → 収束

### 制御
- デフォルト上限: 5 回
- 追加可能: +3 回（ユーザー指示で）
- Hard limit: 8 回

### 各 iteration
- 全文はファイルに保存（MUST）
- 画面にはサマリーのみ
- パターンは自動ローテーション

### 収束時
- 累計サマリー表示 → 自動的に Step 10（Spec 化）に遷移

### MUST ルールとの関係
- MUST-2（全文表示）の例外: 自動反復モード中は画面サマリーのみ。ユーザーが自動反復を明示的に選択した時点で全文省略に同意とみなす。
- MUST-10（追加）: 自動反復モード中、各 iteration の出力をファイルに保存する（省略不可）

---

## v2 マージ仕様

### kit/ への反映
1. kit/patterns.md 新規作成（20 パターン + 5 プリセット）
2. kit/skills/dge-session.md に Step 3.5 パターン選択追加
3. テンプレート → プリセット自動推奨マッピング
4. verify-poc / audience / hallucination check を SHOULD 追加
5. kit/integration-guide.md にマージルール概念追加
6. kit/README.md にパターン早見表追加
7. リポジトリ README.md / README.en.md にパターンセクション追加

### テンプレート → プリセット マッピング
| テンプレート | 推奨プリセット |
|---|---|
| api-design | feature-extension |
| feature-planning | new-project |
| go-nogo | advocacy |
| incident-review | comprehensive |
| security-review | pre-release |

### 取り込まないもの
- dge-ui-spec.md（AskOS 固有）
- agent-monitoring-design-note.md（AskOS 固有）

---

## Gap 一覧（2 sessions 統合）

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 59 | テンプレートとパターンの関係が未定義 | Spec-impl mismatch | **High** |
| 60 | skill にパターン選択ステップがない | Missing logic | **Critical** |
| 61 | backward compatibility | Integration gap | **High** |
| 62 | verify-poc はコード前提 | Integration gap | Medium |
| 63 | audience の概念がない | Missing logic | Medium |
| 64 | 自動推奨ロジック未定義 | Missing logic | **High** |
| 65 | hallucination チェックのレベル不明確 | Spec-impl mismatch | Medium |
| 66 | 「実装可能」の判断基準が未定義 | Missing logic | **High** |
| 67 | 自動反復と MUST-2 の衝突 | Spec-impl mismatch | **High** |
| 68 | MUST の例外規定が必要 | Missing logic | **High** |
| 69 | パターンローテーション戦略 | Missing logic | Medium |
| 70 | 反復回数の制御 | Safety gap | **High** |

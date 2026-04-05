# DGE Session: v2 マージ戦略 — 20 パターン・7 フェーズの toolkit 統合

- **日付**: 2026-03-29
- **テーマ**: DGE v2 の 20 パターン・7 フェーズ・ドキュメントマップを現行 toolkit にマージし skills 化・README 更新する戦略
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル
- **テンプレート**: feature-planning.md ベース

---

## マージ対象の判断

### 取り込む（kit/ に反映）
1. **dge-dialogue-patterns.md** — 20 パターン + 5 プリセット → `kit/patterns.md`
2. **skill-dge/SKILL.md** — 7 フェーズの差分 → skill に Step 3.5 パターン選択追加、verify-poc/audience を SHOULD 追加
3. **dge-document-map.md** — マージルール概念のみ → integration-guide.md に追記

### 取り込まない（docs/dge-v2/ に参照用として残す）
- **dge-ui-spec.md** — AskOS 固有の UI 仕様
- **agent-monitoring-design-note.md** — AskOS 固有のエージェント監視
- **README.md / README.ja.md** — AskOS 視点の概要（リポジトリ README は独自に持つ）

### 移動
- **DGE-article-revised-ja.md** → `paper/` に移動

---

## テンプレート × パターンの二軸構造

テンプレート = テーマ（何をレビューするか）
パターン = 角度（どういう視点で攻めるか）
直交する概念。組み合わせて使う。

### テンプレート → 推奨プリセットのマッピング

| テンプレート | 推奨プリセット |
|---|---|
| api-design | feature-extension |
| feature-planning | new-project |
| go-nogo | advocacy |
| incident-review | comprehensive |
| security-review | pre-release |

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 59 | テンプレートとパターンの関係が未定義 | Spec-impl mismatch | **High** |
| 60 | skill にパターン選択ステップがない | Missing logic | **Critical** |
| 61 | パターン選択をオプション vs 必須。backward compatibility | Integration gap | **High** |
| 62 | verify-poc はコード前提。企画段階で使えない | Integration gap | Medium |
| 63 | audience の概念がない | Missing logic | Medium |
| 64 | パターンの自動推奨ロジック（テンプレート → プリセット）未定義 | Missing logic | **High** |
| 65 | hallucination チェックの実装レベル不明確 | Spec-impl mismatch | Medium |

---

## MVP 成果物

| # | 成果物 | 対応 Gap |
|---|--------|---------|
| 1 | kit/patterns.md 新規作成（20 パターン + 5 プリセット） | #59, #60 |
| 2 | kit/skills/dge-session.md に Step 3.5 パターン選択追加 | #60, #61, #64 |
| 3 | kit/integration-guide.md にマージルール概念追加 | — |
| 4 | kit/README.md にパターン早見表追加 | — |
| 5 | リポジトリ README.md / README.en.md にパターンセクション追加 | — |
| 6 | paper/ に論文改訂版を移動 | — |
| 7 | verify-poc / audience を SHOULD として skill に追加 | #62, #63 |

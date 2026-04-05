# DGE Session: 推奨アルゴリズム High Gap 深掘り

- **日付**: 2026-03-30
- **テーマ**: Gap #83, #84, #89 の深掘り — 推奨の動的価値、テーマ分析の精度、API レスポンスの確定
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル + Red Team + 大和田
- **テンプレート**: api-design.md
- **パターン**: expertise-contrast + before-after

---

## 解決された Gap

### Gap #83: デフォルト + テーマ補正の 2 層構造
- デフォルト推奨（テンプレートのハードコードテーブル）
- テーマ補正（keyword matching でベクトルを加算）
- 補正がなければデフォルトに fallback

### Gap #84: v1 keyword, v1.1 LLM
- v1: keyword matching のみ（LLM 不要で動く）
- v1.1: LLM が設定されていれば自動切り替え
- 推奨結果に `method: "keyword" | "llm" | "default"` を表示

### Gap #89: method フィールド追加
- レスポンスに `method` フィールドで推奨方式を明示
- `score_breakdown` は v2

---

## 新規 Gap

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 90 | skill→API はサーバー起動必須。サーバーなしモード必要 | Integration gap | **High** |
| 91 | 不足視点警告の生成ロジック（動的生成） | Missing logic | Medium |

---

## v1 実装仕様（確定）

### recommend エンジン（200 行以内）
1. テーマ分析: keyword matching（KEYWORD_MAP）
2. 推奨生成: デフォルト + テーマ補正 + 貪欲法（marginal coverage）
3. 今泉 default: true
4. 不足視点: coverage < 0.3 の軸を自動検出
5. レスポンス: recommended[], missing_perspectives[], coverage{}, method

### skill のサーバー検出
- localhost:3456 応答あり → API モード
- 応答なし → ローカルモード（skill 内で同等ロジック）

### API レスポンス形式
```json
{
  "recommended": [
    { "id": "...", "name": "...", "icon": "...", "reason": "...", "score": 0.0, "default": false }
  ],
  "missing_perspectives": ["..."],
  "coverage": { "axis_name": 0.0 },
  "method": "keyword | llm | default"
}
```

### ロードマップ
- v1: keyword matching + 貪欲法（サーバー + ローカル両対応）
- v1.1: LLM 分析追加（ANTHROPIC_API_KEY 設定時）
- v2: score_breakdown + 過去 session 学習 + A/B テスト

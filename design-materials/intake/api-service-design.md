# DGE Session: DGE toolkit の API サービス化

- **日付**: 2026-03-30
- **テーマ**: axes ベクトルベースのキャラクター管理 API、推奨エンジン、npm kit との共存
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル + Red Team + 大和田
- **テンプレート**: api-design.md

---

## 設計決定

### パッケージ分離
```
@unlaxer/dge-toolkit  ← markdown only（現行）
@unlaxer/dge-server   ← Node.js サーバー（kit を peerDependency）
```

### 技術スタック
- Hono + better-sqlite3 + TypeScript
- デフォルト: 127.0.0.1:3456
- LLM なしでも CRUD 動作

### API エンドポイント

```
# キャラクター CRUD（LLM 不要）
GET    /api/characters
GET    /api/characters/:id
POST   /api/characters
PUT    /api/characters/:id
DELETE /api/characters/:id

# AI 生成（LLM 必要 — 未設定時 501）
POST   /api/characters/generate     ← 名前+出典 → axes 推定
POST   /api/characters/recommend    ← テーマ → 推奨キャラ

# パターン（LLM 不要）
GET    /api/patterns
POST   /api/patterns/recommend      ← テーマ → 推奨プリセット（LLM 必要）

# セッション（LLM 不要）
POST   /api/sessions/start
GET    /api/sessions/:id
GET    /api/sessions

# メディア（将来）
POST   /api/characters/:id/media
GET    /api/characters/:id/media
```

### axes スキーマ
```yaml
axes (float 0.0-1.0):
  decision_speed, risk_tolerance, delegation_level,
  quality_obsession, simplicity_preference

axes (enum):
  communication: [innocent_question, brutal_honesty, diplomatic, commanding, understated_wisdom, self_deprecating]
  conflict_resolution: [avoid, non_negotiable, mediate, reframe, overwhelm, flee_then_return]
```

### セキュリティ
- localhost only デフォルト（--host で外部公開）
- LLM エンドポイント: 10 req/min rate limit
- 入力: name/source 200 文字制限
- SQLi: better-sqlite3 バインド変数
- Prompt injection: system prompt でサンドボックス化

### Data Model
```sql
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT,
  archetype TEXT,
  icon TEXT,
  axes TEXT NOT NULL,        -- JSON
  prompt_core TEXT NOT NULL,
  is_builtin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 71 | ターゲットユーザー不明確 | Business gap | **High** |
| 72 | 提供形態未決定（セルフホスト v1） | Business gap | **High** |
| 73 | LLM API キー管理 | Safety gap | **High** |
| 74 | LLM 依存/非依存の分離 | Missing logic | **High** |
| 75 | session API はチーム向け | Business gap | Medium |
| 76 | axes 矛盾バリデーション | Error quality | Low |
| 77 | media IP リスク | Legal gap | Medium |
| 78 | DB 配置とバックアップ | Ops gap | Medium |
| 79 | Prompt injection | Safety gap | **High** |
| 80 | Rate limiting | Safety gap | **High** |
| 81 | localhost デフォルト | Safety gap | **High** |
| 82 | npm パッケージ分離 | Missing logic | **Critical** |

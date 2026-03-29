# @unlaxer/dge-server

DGE API サーバー — キャラクター管理、推奨エンジン、session 追跡。

## セットアップ

```bash
cd server
npm install
npm start
# → http://localhost:3456
```

サーバーは `@unlaxer/dge-toolkit`（kit）がなくても動作しますが、DGE session の実行には kit が必要です。

## API

### キャラクター（LLM 不要）
```
GET    /api/characters          全キャラ一覧
GET    /api/characters/:id      キャラ詳細
POST   /api/characters          カスタムキャラ作成
PUT    /api/characters/:id      カスタムキャラ更新
DELETE /api/characters/:id      カスタムキャラ削除
```

### 推奨エンジン（v1: keyword ベース、LLM 不要）
```
POST   /api/characters/recommend   テーマ → 推奨キャラセット
POST   /api/patterns/recommend     テンプレート → 推奨プリセット
```

### パターン
```
GET    /api/patterns               20 パターン + 5 プリセット
```

### セッション
```
GET    /api/sessions               session 一覧
GET    /api/sessions/:id           session 詳細
POST   /api/sessions               session 記録
```

### プロジェクト
```
GET    /api/projects               プロジェクト一覧
POST   /api/projects               プロジェクト作成
```

## 設定

| 環境変数 | デフォルト | 説明 |
|---------|-----------|------|
| `DGE_PORT` | 3456 | ポート番号 |
| `DGE_DB_PATH` | `server/data/dge.db` | SQLite ファイルパス |

## セキュリティ

- **デフォルト**: localhost only（127.0.0.1）
- **外部公開**: `npm start -- --host` で 0.0.0.0 にバインド
- built-in キャラは変更・削除不可

## ライセンス

MIT

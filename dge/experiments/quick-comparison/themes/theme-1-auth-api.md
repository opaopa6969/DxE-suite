# テーマ 1: 認証 API の設計

## 設計ドキュメント（両条件で同じ入力を使用）

### 概要
Web アプリケーションの認証 API。JWT ベースのトークン認証。

### エンドポイント
- POST /api/auth/login — メールアドレス + パスワードでログイン → JWT 発行
- POST /api/auth/refresh — リフレッシュトークンで新しい JWT を取得
- POST /api/auth/logout — ログアウト
- GET /api/auth/me — 現在のユーザー情報取得

### トークン仕様
- アクセストークン: JWT, 有効期限 15 分
- リフレッシュトークン: opaque token, 有効期限 30 日
- アクセストークンは Authorization: Bearer ヘッダーで送信

### 認証フロー
1. ユーザーがメール + パスワードでログイン
2. サーバーが検証し、アクセストークン + リフレッシュトークンを返す
3. クライアントはアクセストークンを使って API にアクセス
4. アクセストークンが期限切れになったら、リフレッシュトークンで更新
5. ログアウト時にリフレッシュトークンを無効化

### データモデル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

# Theme 1: 認証 API — 素の LLM レビュー

> プロンプト: 「以下の認証 API の設計をレビューして。問題点、考慮漏れ、矛盾を全て挙げて。各問題に Severity をつけて。」

## 指摘一覧

| # | 問題点 | Category | Severity |
|---|--------|----------|----------|
| 1 | パスワードのハッシュアルゴリズムが未指定（bcrypt? argon2?） | Missing logic | Medium |
| 2 | ログインの試行回数制限（レート制限）がない。ブルートフォース攻撃に脆弱 | Security gap | High |
| 3 | リフレッシュトークンのローテーションポリシーが未定義。盗まれたトークンが30日間有効 | Security gap | Critical |
| 4 | ログアウト時のアクセストークンの無効化方法が未定義。JWT はステートレスなので即時無効化できない | Missing logic | High |
| 5 | リフレッシュトークンの保存場所（localStorage vs httpOnly Cookie）が未指定 | Missing logic | High |
| 6 | CORS の設定が未定義 | Missing logic | Medium |
| 7 | メールアドレスの検証（確認メール送信）フローがない | Missing logic | Medium |
| 8 | パスワードリセットフローがない | Missing logic | High |
| 9 | refresh_tokens テーブルに revoked_at カラムがない。論理削除できない | Missing logic | Medium |
| 10 | 同一ユーザーの複数デバイスログインの制御がない | Missing logic | Low |
| 11 | 2FA（二要素認証）の考慮がない | Missing logic | Medium |
| 12 | アクセストークンの payload に含める claim が未定義（user_id のみ？ role も？） | Missing logic | Medium |
| 13 | HTTPS の強制が記載されていない | Security gap | High |
| 14 | セッションハイジャック対策（token binding 等）がない | Security gap | Medium |
| 15 | エラーレスポンスの形式が未定義（401? 403? メッセージ内容?） | Error quality | Medium |

## サマリー
- 総数: 15 件
- Critical: 1, High: 4, Medium: 8, Low: 2
- カテゴリ: Missing logic (10), Security gap (4), Error quality (1)
- カバレッジ: 3/11 カテゴリ

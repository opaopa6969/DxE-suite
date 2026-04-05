# テーマ 2: SaaS の課金モデル設計

## 設計ドキュメント

### 概要
B2B SaaS のプロジェクト管理ツール。チーム向け月額課金。

### プラン
| プラン | 月額 | メンバー数 | ストレージ | 機能 |
|--------|------|-----------|-----------|------|
| Free | $0 | 3 人まで | 1GB | 基本機能 |
| Pro | $10/user/月 | 無制限 | 50GB | 全機能 |
| Enterprise | 要問合せ | 無制限 | 無制限 | 全機能 + SSO + 監査ログ |

### 課金 API
- POST /api/billing/subscribe — プラン変更
- POST /api/billing/cancel — サブスクリプション解約
- GET /api/billing/invoices — 請求書一覧
- POST /api/billing/payment-method — 支払い方法の更新

### 課金エンジン
Stripe を使用。webhook でイベントを受信。

### データモデル
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  plan VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  stripe_invoice_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

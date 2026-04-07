# DVE Slack 連携ガイド

## しくみ（中学生向け）

DVE は「プロジェクトの決定の歴史」をグラフで見せるツール。
Slack 連携すると、**Slack から直接** その歴史を検索・閲覧できる。

```
あなた（Slack）
  ↓  /dve trace DD-003
  ↓
Slack のサーバー
  ↓  「この人が /dve コマンドを打った」
  ↓  → DVE のサーバーに HTTP POST で転送
  ↓
DVE API サーバー (dve.unlaxer.org:4174)
  ↓  graph.json を読んで DD-003 の因果チェーンを検索
  ↓  結果を JSON で返す
  ↓
Slack のサーバー
  ↓  JSON をメッセージに変換して表示
  ↓
あなた（Slack）
  ↓  DD-003 の経緯が表示される！
```

### 3 つの通信方式

| 方式 | 方向 | 用途 |
|------|------|------|
| **Incoming Webhook** | DVE → Slack | 通知を送る（enforcement violation, pending decisions 等） |
| **Slash Command** | Slack → DVE | `/dve trace DD-003` のようなコマンドで DVE に問い合わせ |
| **Events API** | Slack → DVE | `@DVE DD-003の経緯は？` のようなメンションで DVE に問い合わせ |

### Incoming Webhook のしくみ

```
DVE サーバーで何かが起きた（例: enforcement violation）
  ↓
DVE が Slack の Webhook URL に HTTP POST を送る
  ↓  POST https://hooks.slack.com/services/T.../B.../xxx
  ↓  body: {"text": "[DRE critical] 会話劇が保存されていません"}
  ↓
Slack がそのメッセージをチャンネルに表示する
```

**ポイント**: Webhook URL は「このチャンネルにメッセージを投稿していいよ」という許可証。
URL を知っている人なら誰でも投稿できるので、**外部に漏らさない**。

### Slash Command のしくみ

```
あなたが Slack で /dve orphans と入力
  ↓
Slack が DVE のサーバーに HTTP POST を送る
  ↓  POST https://dve.unlaxer.org/api/slack/command
  ↓  body: text=orphans&user_id=U123&channel_id=C456
  ↓
DVE サーバーが graph.json を検索
  ↓  未解決 Gap を見つける
  ↓
DVE が Slack に JSON で結果を返す
  ↓  {"response_type": "in_channel", "text": "Orphan Gaps (11)..."}
  ↓
Slack がチャンネルにメッセージとして表示
```

**ポイント**: Slash Command は「ユーザーがコマンドを打つ → DVE が答える」の往復。
DVE サーバーが動いていないと応答できない。

### Events API のしくみ

```
あなたが Slack で @DVE DD-003の経緯は？ と書く
  ↓
Slack が DVE のサーバーにイベントを送る
  ↓  POST https://dve.unlaxer.org/api/slack/events
  ↓  body: {"type": "event_callback", "event": {"type": "app_mention", "text": "DD-003の経緯は？"}}
  ↓
DVE がテキストを解析して適切なクエリを実行
  ↓
DVE が Slack API を使って返信を投稿
  ↓  POST https://slack.com/api/chat.postMessage
  ↓  body: {"channel": "C456", "text": "DD-003: DVE 技術スタック..."}
```

**ポイント**: Events API は Slash Command と違って、DVE から Slack に「自分から」メッセージを送る。
そのために **Bot Token** (xoxb-...) が必要。

---

## セットアップ手順

### 前提条件

- DVE サーバーが `dve.unlaxer.org` で動いている
- `/api/slack/*` パスは認証バイパス済み

### 1. Slack App 作成

1. https://api.slack.com/apps → **Create New App** → **From scratch**
2. App Name: `DVE` (or `DxE`)
3. Workspace: 自分のワークスペースを選択

### 2. Incoming Webhooks（通知用）

1. 左メニュー **Incoming Webhooks** → トグル **On**
2. **Add New Webhook to Workspace** → `#dxe-notifications` チャンネルを選択
3. 生成された URL をコピー

```bash
# .bashrc に追加
export DRE_NOTIFY_URL="https://hooks.slack.com/services/T.../B.../xxx"
```

### 3. Slash Commands

1. 左メニュー **Slash Commands** → **Create New Command**

| 設定 | 値 |
|------|---|
| Command | `/dve` |
| Request URL | `https://dve.unlaxer.org/api/slack/command` |
| Short Description | DVE — Decision Visualization |
| Usage Hint | `list dd / trace DD-001 / orphans / search JWT / status / help` |

### 4. Event Subscriptions（オプション: @DVE メンション）

1. 左メニュー **Event Subscriptions** → トグル **On**
2. Request URL: `https://dve.unlaxer.org/api/slack/events`
   （Verified と表示されるまで待つ）
3. **Subscribe to bot events** → **Add Bot User Event** → `app_mention`
4. Save Changes

### 5. Interactivity（ボタンクリック用）

1. 左メニュー **Interactivity & Shortcuts** → トグル **On**
2. Request URL: `https://dve.unlaxer.org/api/slack/interactive`
3. Save Changes

### 6. OAuth & Permissions

Bot Token Scopes に追加:
- `commands`
- `chat:write`
- `app_mentions:read`

### 7. Install to Workspace

1. 左メニュー **Install App** → **Install to Workspace** → 許可
2. **Bot User OAuth Token** (`xoxb-...`) をコピー

```bash
# .bashrc に追加
export SLACK_BOT_TOKEN="xoxb-..."
```

### 8. 確認

```bash
source ~/.bashrc
dve serve --watch
```

Slack で:
```
/dve help
/dve list dd
/dve status
/dve trace DD-003
```

---

## 使えるコマンド

| コマンド | 説明 |
|----------|------|
| `/dve help` | コマンド一覧 |
| `/dve list [dd\|gap\|session\|spec]` | 一覧（ボタン付き） |
| `/dve trace DD-001` | 因果チェーン（DD → Gap → Session） |
| `/dve orphans` | 未解決 Gap（DD に紐づかない） |
| `/dve search <keyword>` | 全文検索 |
| `/dve status` | 全プロジェクトの状態 |
| `/dve summary` | 統計サマリー |
| `/dve overturned` | 撤回された DD |
| `@DVE DD-003の経緯は？` | メンションで問い合わせ |

---

## 通知レベル設定

`.dre/dre-config.json`:

```json
{
  "notifications": {
    "channel": "slack",
    "min_level": "critical"
  }
}
```

| min_level | 通知される内容 |
|-----------|---------------|
| `critical` | enforcement violation, Stop blocked, DD overturn のみ |
| `daily` | 上記 + pending decisions, orphan gaps, drift |
| `all` | 上記 + graph stale, build 完了 |
| `none` | 通知しない |

---

## トラブルシューティング

**`/dve` が応答しない:**
- `dve serve` が動いているか確認
- `curl https://dve.unlaxer.org/api/slack/command -X POST -d "text=help"` で応答を確認

**Events URL が Verified にならない:**
- `curl -X POST https://dve.unlaxer.org/api/slack/events -H 'Content-Type: application/json' -d '{"type":"url_verification","challenge":"test"}'`
- `{"challenge":"test"}` が返ればOK。返らなければプロキシ設定を確認

**通知が来ない:**
- `echo $DRE_NOTIFY_URL` で URL が設定されているか確認
- `curl -X POST $DRE_NOTIFY_URL -H 'Content-Type: application/json' -d '{"text":"test"}'` で手動テスト
- `.dre/dre-config.json` の `min_level` が `none` になっていないか確認

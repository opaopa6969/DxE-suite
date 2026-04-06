# DGE Session: DRE 通知システム設計

- **Date**: 2026-04-07
- **Flow**: quick
- **Structure**: roundtable
- **Characters**: 今泉, ヤン, リヴァイ, 僕
- **Rounds**: 1

---

## テーマ

DRE hook からの通知 — ユーザーインタラクションが必要な場面で Slack / terminal / webhook 通知。

## Scene 1: いつ通知が必要か

**👤 今泉**: そもそも、通知が必要なのはどういうタイミングですか？

**⚔ リヴァイ**: 2つのケース。A. ユーザーがいない場面（auto-iterate, バックグラウンドビルド, scheduled agent）。B. いるが気づきにくい場面（暗黙の決定蓄積, drift 検出）。

**☕ ヤン**: A が本命。scheduled agent で DGE を回したとき、Gap が見つかったら通知してほしい。

**😰 僕**: でも通知が多すぎると無視されますよね...

→ Gap 発見: 通知の粒度制御が必要。プロジェクト単位・severity 単位でフィルタしないとノイズになる。

## Scene 2: 何を通知するか

**⚔ リヴァイ**: 通知すべきイベントをランク分け。

🔴 即時通知 (Critical): DGE auto-iterate 収束, enforcement violation, DD overturn
🟡 サマリー通知 (Daily): pending decisions, orphan gaps 増加, drift, graph stale
🟢 通知しない: 個々の Gap 発見, commit DD 参照 warn, 通常 build 完了

→ Gap 発見: 通知を Critical(即時) / Daily(サマリー) / Silent の 3 段階に分類。

## Scene 3: どこに通知するか

**☕ ヤン**: webhook が統一インターフェース。Slack も Discord も custom も全部 URL + JSON body。

**😰 僕**: webhook URL をどこに保存するんですか...config に入れると git で公開されちゃう...

**☕ ヤン**: 環境変数。DRE_NOTIFY_URL。config には channel の種類だけ書いて、URL は環境変数から取る。

→ Gap 発見: webhook URL は環境変数 (DRE_NOTIFY_URL)。config には種別とフィルタのみ。

## Gap 一覧

| # | Gap | Category | Severity | Status |
|---|-----|----------|----------|--------|
| 1 | 通知の粒度制御（プロジェクト × severity フィルタ） | UX | High | Resolved — dre-config.json min_level |
| 2 | 通知を Critical/Daily/Silent の 3 段階に分類 | missing logic | High | Resolved — notify.sh level filter |
| 3 | webhook URL は環境変数。config には種別とフィルタのみ | integration | Medium | Resolved — DRE_NOTIFY_URL |

## 設計決定

- 通知は notify.sh 関数として実装。他の hook から `dre_notify level title body` で呼ぶ
- チャネル: slack / discord / webhook / desktop / none
- 粒度: dre-config.json の `notifications.min_level` で制御
- URL: 環境変数 `DRE_NOTIFY_URL`（git に入れない）
- 全通知を `.dre/notifications.json` にログ（DVE で表示可能）

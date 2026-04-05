# Theme 2: 課金モデル — 素の LLM レビュー

> プロンプト: 「以下の SaaS 課金モデルの設計をレビューして。問題点、考慮漏れ、矛盾を全て挙げて。各問題に Severity をつけて。」

## 指摘一覧

| # | 問題点 | Category | Severity |
|---|--------|----------|----------|
| 1 | プラン変更時の按分計算（proration）ルールが未定義 | Missing logic | High |
| 2 | Free → Pro のアップグレード時のデータ移行（ストレージ制限の扱い） | Missing logic | Medium |
| 3 | 解約後のデータ保持期間が未定義。即時削除？ 30 日猶予？ | Missing logic | High |
| 4 | Stripe webhook の冪等性処理が記載されていない | Missing logic | High |
| 5 | webhook の検証（Stripe 署名の確認）が記載されていない | Security gap | High |
| 6 | Free プランの 3 人制限を超えた場合のフロー（招待できない？ 既存メンバーを外す？） | Missing logic | Medium |
| 7 | 支払い失敗時のリトライ戦略・猶予期間が未定義 | Missing logic | High |
| 8 | 年額プランの有無。年額割引は一般的 | Missing logic | Low |
| 9 | 税金（消費税/VAT）の計算が考慮されていない | Legal gap | Medium |
| 10 | 請求書の PDF 生成・ダウンロード機能が記載されていない | Missing logic | Low |
| 11 | Enterprise プランの「要問合せ」のフローが未定義 | Missing logic | Medium |
| 12 | サブスクリプションの一時停止機能がない | Missing logic | Low |
| 13 | subscriptions テーブルにプラン変更の履歴が残らない | Missing logic | Medium |
| 14 | チームのオーナーだけが課金操作できるのか、権限が未定義 | Missing logic | Medium |
| 15 | 通貨が USD 固定なのか、多通貨対応なのか未記載 | Missing logic | Low |

## サマリー
- 総数: 15 件
- Critical: 0, High: 4, Medium: 6, Low: 5
- カテゴリ: Missing logic (13), Security gap (1), Legal gap (1)
- カバレッジ: 3/11 カテゴリ

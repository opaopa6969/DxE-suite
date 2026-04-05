# Theme 3: リファクタ計画 — 素の LLM レビュー

> プロンプト: 「以下のリファクタ計画をレビューして。問題点、考慮漏れ、矛盾を全て挙げて。各問題に Severity をつけて。」

## 指摘一覧

| # | 問題点 | Category | Severity |
|---|--------|----------|----------|
| 1 | テストカバレッジ 35% → 80% の段階的目標がない。一気に上げるのは非現実的 | Missing logic | High |
| 2 | God Class 分割の具体的な分割戦略がない（どこで切る？） | Missing logic | High |
| 3 | GraphQL 移行と同時に REST を維持する期間の並行運用コストが未検討 | Missing logic | Medium |
| 4 | ジュニア 2 名にリファクタを任せるリスク。レガシーコードの理解が不十分 | Missing logic | High |
| 5 | ロールバック戦略がない。God Class 分割中にバグが出たらどう戻す？ | Missing logic | High |
| 6 | デプロイ手順が「SSH + cap deploy」→ CI/CD への移行計画の詳細がない | Missing logic | Medium |
| 7 | Phase 3 の GraphQL 移行はフロントエンドの変更も必要。デザイナー 0 名で大丈夫？ | Missing logic | Medium |
| 8 | 新機能開発が止まることへのビジネスインパクトが未評価 | Business gap | High |
| 9 | 移行中の本番障害のリスク軽減策（feature flag 等）がない | Missing logic | High |
| 10 | REST → GraphQL の移行で既存の外部連携（API クライアント）が壊れる | Integration gap | High |
| 11 | テストの種類（unit / integration / e2e）のバランスが未定義 | Missing logic | Medium |
| 12 | 7 ヶ月のスケジュールの見積もり根拠がない | Missing logic | Medium |
| 13 | コードレビューのルールが変わる？ リファクタ中のレビュー基準は？ | Missing logic | Low |
| 14 | ドキュメントの更新計画がない | Missing logic | Low |

## サマリー
- 総数: 14 件
- Critical: 0, High: 6, Medium: 5, Low: 3
- カテゴリ: Missing logic (12), Business gap (1), Integration gap (1)
- カバレッジ: 3/11 カテゴリ

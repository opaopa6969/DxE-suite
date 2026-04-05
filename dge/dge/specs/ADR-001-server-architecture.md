---
status: implemented
source_session: design-materials/intake/api-service-design.md
source_gap: "#71, #72"
---

<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。 -->

# ADR-001: API サーバーのアーキテクチャ選定

## Context

DGE toolkit にキャラクター管理・推奨エンジン・session 管理の API サーバーを追加する。ターゲットユーザーと提供形態を決定する必要がある。

## Options

### A: セルフホスト（推奨）
- ユーザーが自分のマシンで `npm start` で起動
- MIT ライセンス。無料
- DB: SQLite（ファイルベース、DB サーバー不要）
- Pro: 運用コストゼロ。個人情報がローカルに留まる
- Con: ユーザーがサーバーを管理する必要がある

### B: SaaS
- 我々がホストする。月額課金
- Pro: ユーザーの手間ゼロ。チーム共有が容易
- Con: 運用コスト大。プライバシー懸念。収益化の前にユーザーベースが必要

### C: SDK
- 他の AI ツールが DGE のエンジンを組み込む
- Pro: プラットフォーム化
- Con: 顧客が少なすぎる段階

## Decision

**A: セルフホストを v1 とする。**

理由:
- DGE toolkit は MIT の OSS。まず使われることが最優先
- 個人開発者が `npm start` 一発で試せる手軽さ
- SaaS は「使われている」実証ができてから検討
- kit（markdown）はサーバーなしで完全に動作し続ける

## Consequences

- サーバーは `@unlaxer/dge-server` として別パッケージ
- kit は変更なし。サーバーはオプション
- セキュリティはセルフホスト前提（localhost デフォルト）
- SaaS への移行パスは将来の ADR で判断

[English version](README.md)

# AskOS — ポートフォリオ・オーケストレーション・プラットフォーム

AIコーディングエージェントが自律的に作業し、人間のオペレーターが統合ダッシュボードで監督するマルチプロジェクト・エージェント・オーケストレーション・プラットフォーム。人間の判断が必要な場面 — アーキテクチャ選択、優先度の競合、曖昧な要件 — に到達したとき、システムは **Ask（質問）** する。

> **なぜ「Ask」か？** この名前は質問キューだけを指すのではない。プラットフォームの全レイヤーに貫かれている設計原則を表している：人間の判断は構造化されたタッチポイントを通じてシステムに入る。ワークフローのエスカレーション、Commander トリアージ、human decision ステップ、ディレクティブ — すべて同じ原理に集約される。機械ができることは機械がやる。できないことは、人間に聞く。

## AskOS が何をするか

```
人間オペレーター
  ├─ Web ダッシュボード (React)     ← 質問、タスク、エージェント、ドキュメント
  ├─ AI ターミナル (Claude Code)    ← 常駐パネル、自動起動
  └─ Slack (予定)
        │
  オーケストレーター API (Express, 48+ エンドポイント)
        │
  ┌─────┴──────────────────────────────────────────────┐
  │                                                    │
  Portfolio Commander     Project Commanders            │
  (プロジェクト横断         (プロジェクト別トリアージ、     │
   調整)                    spec/意思決定マッチング)      │
        │                        │                      │
        │              ┌─────────┼─────────┐            │
        │              実装       レビュー    Adopted     │
        │              Agent     Agent      Agent       │
        │                   │                           │
  Workflow Engine            Runtime Adapter (tmux)      │
  (contract ベースの         ├─ stdout-watcher           │
   ステップ実行、            ├─ inbox 配信               │
   YAML 定義)               └─ セッション管理            │
        │                                               │
  DGE ワークフロー (予定)                                │
  (会話劇 → spec 発見)                                   │
  └────────────────────────────────────────────────────┘
```

## 主な機能

**質問駆動オーケストレーション** — エージェントが意思決定を構造化された質問としてエスカレーション。6 ルールの Commander トリアージが自動解決できるものを処理し、残りを人間に届ける。

**Workflow Engine** — YAML 定義による contract ベースのステップ実行。各ステップは出力の JSON Schema を宣言し、エンジンが検証してからルーティング。human decision ステップ、フィードバック付きリトライ、AskOS question へのエスカレーション、4 種類の介入（pause / inject / redirect / interject）をサポート。

**エージェントライフサイクル** — API でエージェントの登録・起動・停止・再起動。外部 tmux コーディングエージェント（Claude Code, Codex, Gemini, Aider）を AskOS 管理下に取り込む Adopt 機能。ハートビート監視と dead エージェント自動検知。

**ポートフォリオ・プロジェクト管理** — 関連プロジェクトをポートフォリオにグループ化。on-change アクション付きのプロジェクト依存関係。フェーズシステム（spec / implementation / stabilization / maintenance）と Commander による強制。

**AI ターミナル** — 全ページに常駐する底部パネル。Claude Code をプロジェクトコンテキスト付きで自動起動。新規プロジェクト向けオンボーディングガイド。

**リカバリ** — 起動時リカバリジョブ、stale 質問検出、ハートビートモニター、watcher 自動再接続。再起動をまたいでシステムが自己修復する。

**意思決定キャプチャ** — 人間の回答はプロジェクトの意思決定ログに自動追記。Commander が過去の判断を参照して将来の自動解決に活用。

**メトリクス・可視化** — Attention ヒートマップ、Commander 効率メトリクス、不在復帰サマリー、GTD 式アクションリスト、システム診断。

## クイックスタート

```bash
npm install
npm run dev          # API サーバー → http://localhost:3000
npm run dev:web      # Web UI（開発モード）→ http://localhost:5173
npm test             # 156 テスト / 13 スイート
```

## アーキテクチャ

| レイヤー | 技術 | 役割 |
|---------|------|------|
| スキーマ | Zod, Ajv | エンティティバリデーション (Zod)、ワークフロースキーマ検証 (Ajv)、ID 戦略 (ULID) |
| データベース | SQLite (better-sqlite3, WAL) | 永続状態、イベントログ、リードモデル |
| オーケストレーター | TypeScript | コマンドハンドラ、Commander トリアージ、配信、意思決定キャプチャ |
| Workflow Engine | TypeScript, js-yaml | YAML ローダー、10 セマンティック検証、6 段階抽出、contract 実行 |
| リカバリ | TypeScript | stale 検出、ハートビートモニター、起動時リカバリ |
| API | Express | 48+ REST エンドポイント |
| Web UI | React + Vite | ダッシュボード、質問キュー、タスクボード、エージェント管理、AI ターミナル |
| ランタイム | tmux | エージェントセッション管理、stdout-watcher、inbox 配信 |

## 実装状況

| スライス | 状態 | 概要 |
|---------|------|------|
| A — 質問ループ | 完了 | スキーマ、DB、オーケストレーター、エージェントプロトコル、Commander トリアージ |
| B — Commander | 完了 | 6 ルール、データ駆動設定、コンテキスト組立、意思決定自動キャプチャ |
| C — ダッシュボード | 完了 | React SPA、ダークテーマ、8 ページ、i18n (EN/JA) |
| D — リカバリ | 完了 | 起動ジョブ、stale チェッカー、ハートビートモニター |
| E — Workflow Engine | 完了 | YAML ローダー、セマンティック検証、contract 実行、AskOS ブリッジ |
| F — エージェント管理 | 完了 | 起動/停止/再起動、adopt/release、自動割当、agent-to-agent ハンドオフ |
| G — オーケストレーション | 完了 | ルート分解、非同期ワークフロー、フェーズ強制、ターミナルコマンド |
| H — 非同期ワークフロー | 進行中 | ジョブキューベース実行（現在は同期） |
| I — LLM トリアージ | 予定 | LLM 補強 Commander（フラグのみ存在、ロジック未実装） |

156 テスト / 13 スイート。48+ API エンドポイント。

## プロジェクト構成

```
src/
├── api/                       # REST API (Express, 12 ルートファイル)
├── config/defaults.ts         # 運用デフォルト値
├── db/                        # SQLite 接続 + リポジトリ
├── maintenance/               # stale チェッカー、ハートビート、起動リカバリ
├── orchestrator/
│   ├── commander/             # トリアージルール + コンテキスト組立
│   ├── commands/              # openQuestion, answerQuestion 等
│   ├── delivery/              # Inbox ファイルライター + tmux send-keys
│   └── workflow/              # ワークフローエンジン（ローダー、バリデータ、実行器）
└── runtime/                   # エージェントプロトコル（stdout パーサー、inbox、adopt）
packages/
├── schema/                    # Zod エンティティ定義
└── web/                       # React ダッシュボード (Vite)
docs/                          # 仕様書 + ADR
askos-stories/                 # DGE 会話劇（22 ストーリー、108 UC）
specs/workflow-engine/         # ワークフローエンジン仕様（独立パッケージ）
```

## ドキュメント

### コア
- [ビジョン](docs/vision.md) — プラットフォームの存在理由
- [アーキテクチャ](docs/architecture.md) — システム設計、サブシステム境界
- [現在の機能一覧](docs/current-capabilities.md) — 詳細な機能インベントリと API リファレンス
- [ドメインモデル](docs/domain-model.md) — エンティティ、フィールド、不変条件
- [データモデル](docs/data-model.md) — リレーショナルスキーマ、ID 戦略

### Workflow Engine
- [Workflow Engine README](specs/workflow-engine/README.md) — contract ベース実行仕様
- [ステップモデル](specs/workflow-engine/docs/step-model.md) — who / given / produces / allows / routing
- [Contract 検証](specs/workflow-engine/docs/contract-verification.md) — バリデーションパイプライン
- [AskOS 統合](specs/workflow-engine/docs/integration-askos.md) — エスカレーション、タスクバインディング

### 運用
- [質問ライフサイクル](docs/question-lifecycle.md) — 状態遷移、トリアージフロー、stale ポリシー
- [エージェントプロトコル](docs/agent-protocol.md) — stdout マーカー、inbox 配信
- [API サーフェス](docs/api-surface.md) — REST エンドポイント設計

### DGE（Dialogue Grounding Engineering）
- [AskOS ストーリー](askos-stories/README.md) — 108 の use case を発見した 22 本の会話劇
- [ストーリーから発見された Spec Gap](docs/spec-gap-from-stories.md) — DGE で発見されたギャップ

### 設計判断
- [ADR-005: Commander モデル](docs/decisions/ADR-005-commander-model.md) — トリアージルール、コンテキスト組立
- [ADR-006: トランザクションモデル](docs/decisions/ADR-006-transaction-model.md) — 単一トランザクション書込パターン
- [ADR-007: ID 戦略](docs/decisions/ADR-007-id-strategy.md) — エンティティプレフィックス付き ULID

### 計画
- [バックログ](docs/backlog.md) — 完了状況付き優先度順バックログ
- [実装状況](docs/implementation-status.md) — スライスごとの実装詳細

## AskOS の作り方

AskOS 自身の仕様は Dialogue Grounding Engineering（DGE）で開発された。LLM にユーザーの会話劇を書かせて、フォーマルなレビューでは見つからない仕様ギャップを発見する手法だ。v2→v7 の 5 ラウンドの spec レビューで見つかった問題は約 20 件。DGE 1 セッションで 108 の use case と 97 の spec implication が見つかった。

> **spec レビューを何回しても見つからなかったことが、会話劇 10 分で出てきた。**

## バージョン履歴

- **v0.3.0**: ルート分解、非同期ワークフロー、タスク自動割当、エージェントハンドオフ、adopt、フェーズ強制、ターミナルコマンド、エージェント GUI ダッシュボード
- **v0.2.0**: tmux ランタイム、ワークフローエンジン、ディレクティブ、意思決定自動キャプチャ、attention ヒートマップ、AI ターミナル、ダークテーマ、i18n
- **v0.1.0**: 質問ループ、Commander トリアージ、React ダッシュボード、リカバリサブシステム

## ライセンス

Private

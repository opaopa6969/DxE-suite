# DGE — Dialogue-driven Gap Extraction

[English](README.en.md)

> 仕様書のレビューは「書いてあることの検証」。DGE は「書いてないことの発見」。

## できること

**🎭 会話劇で設計の穴を見つける**
「DGE して」で開始。キャラクターが議論して、仕様書にない前提・暗黙の制約・考慮漏れを発見する。

**📋 Gap を Spec に変換する**
「実装する」で Use Case / Tech Spec / ADR / Design Question を自動生成。レビュー後に実装へ。

**🔄 収束するまで自動で回す**
「実装できるまで回して」で自動反復。新しい Gap が出なくなるまで角度を変えて繰り返す。

**📁 プロジェクト単位で管理する**
複数テーマの DGE session を TreeView で一覧表示。どこまで進んだか一目で分かる。

**🎭 好きなキャラを追加する**
「ガッツを追加して」で有名キャラを永続追加。LLM が性格・名言・トラウマまで分析。
wizard モードなら対話形式でオリジナルキャラも作れる。

**🔧 API サーバー（オプション）**
キャラ管理 + axes ベクトル推奨エンジンの REST API。`npm start` で起動。

## 3 分で分かる DGE — 会話劇で説明

> 先輩（ナレーション）: DGE toolkit の使い方を、DGE のキャラクターが説明する。

**👤 今泉**: 「そもそも DGE って何するツールなんですか？」

**☕ ヤン**: 「`npm install @unlaxer/dge-toolkit` して `npx dge-install`。あとは Claude Code に "DGE して" と言うだけ。」

**👤 今泉**: 「で、何が出てくるんですか？」

**🎩 千石**: 「キャラクターが議論する会話劇です。会話の中で "Gap" — 仕様に書かれていない問題 — が発見されます。」

**👤 今泉**: 「Gap が見つかったら？」

**☕ ヤン**: 「4 択。もう一回回すか、収束するまで自動で回すか、実装するか、後で考えるか。」

**👤 今泉**: 「"実装する" を選んだら？」

**🎩 千石**: 「いきなりコードは書きません。Gap から Spec（Use Case, Tech Spec, ADR 等）を自動生成し、人間がレビューしてから実装です。」

**👤 今泉**: 「好きなキャラを追加できるって聞いたんですけど？」

**☕ ヤン**: 「"ベルセルクのガッツを追加して" って言えば、LLM が性格分析して永続保存。次回から使える。オリジナルキャラも wizard で作れる。」

**⚖ ソウル**: 「重要な注意。DGE が生成する Spec はあくまで "提案"。プロジェクトに既に docs/ があるなら、そっちが Source of Truth。DGE は `dge/` の中に閉じていて、既存ファイルを勝手に書き換えない。」

→ **まとめ**: 会話劇で Gap 発見 → Spec 生成 → レビュー → 実装。install は npm or 手動コピー。カスタムキャラで角度を増やせる。

## 実績

- **unlaxer-parser** (SLE 2026 投稿予定): 5 sessions で 108 gaps を発見
- **AskOS**: 11+ sessions で 14,978 行の設計ドキュメントを生成、16 gaps を adversarial review で発見

## インストール

### npm

```bash
npm install @unlaxer/dge-toolkit
npx dge-install
```

### バージョンアップ

```bash
npm update @unlaxer/dge-toolkit
npx dge-update    # toolkit ファイルのみ上書き。sessions/ custom/ projects/ specs/ は触らない
```

### 手動コピー（npm 不要）

```bash
cp -r kit/ your-project/dge/
cp kit/skills/*.md your-project/.claude/skills/
```

MIT ライセンス。`dge/LICENSE` をプロジェクトに含めてください。

## 使い方

| コマンド | 説明 |
|---------|------|
| 「DGE して」 | 会話劇を生成して Gap を発見 |
| 「実装できるまで回して」 | 自動反復モード（収束まで） |
| 「キャラを追加して」 | カスタムキャラ作成（名指し or wizard） |
| 「DGE を更新して」 | toolkit のバージョン確認・更新案内 |

他の LLM（ChatGPT, Gemini 等）で使う場合は [method.md](kit/method.md) のクイックスタート（方法 A）を参照。

## キャラクター早見表

```
前提が怪しい    → 👤 今泉   「そもそも聞いたんですか？」
品質が低い      → 🎩 千石   「お客様への侮辱です」
全部複雑        → ☕ ヤン   「要らなくない？」
前に進みすぎ    → 😰 僕     「小規模にしませんか...？」
大胆さが足りない → 👑 ラインハルト 「攻めろ」
数字が甘い      → 🦅 鷲津   「IRR は？」
攻撃への耐性    → 😈 Red Team「競合がこうしたら？」
収益の現実      → 🦈 大和田  「いくら稼げるんだ？」
実装の不足      → ⚔ リヴァイ 「汚い。作れ。」
ユーザーの本音   → 🎰 利根川  「ユーザーの言葉で語れ」
隠れた問題      → 🏥 ハウス  「全員嘘をついている」
法的リスク      → ⚖ ソウル  「利用規約は書いたか？」
+ カスタムキャラ 🎭 「ガッツを追加して」で好きなキャラを追加
```

## 会話劇パターン — 20 パターン + 5 プリセット

| プリセット | パターン | 用途 |
|---|---|---|
| 🆕 new-project | zero-state, role-contrast, escalation-chain | 新規プロジェクト |
| 🔧 feature-extension | before-after, cross-persona-conflict, expertise-contrast | 機能追加 |
| 🚀 pre-release | scale-break, security-adversary, concurrent-operation, disaster-recovery | リリース前 |
| 📢 advocacy | before-after, app-type-variation, role-contrast | 社内提案 |
| 🔍 comprehensive | 7 パターン網羅 | 網羅的 DGE |

詳細は [kit/patterns.md](kit/patterns.md) を参照。

## API サーバー（オプション）

キャラクター管理 + axes ベクトル推奨エンジン。

```bash
cd server && npm install && npm start
# → http://localhost:3456
```

```bash
# 推奨エンジン
curl -X POST localhost:3456/api/characters/recommend \
  -H 'Content-Type: application/json' \
  -d '{"agenda":"認証 API の設計","template":"api-design"}'
```

詳細は [server/README.md](server/README.md) を参照。

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [method.md](kit/method.md) | 方法論（3 分版 + 詳細 + クイックスタート） |
| [patterns.md](kit/patterns.md) | 20 パターン + 5 プリセット |
| [characters/catalog.md](kit/characters/catalog.md) | 12 キャラ + prompt + 使い分け |
| [characters/atlas.md](characters/atlas.md) | 文化圏別マッピング（英語圏・中国語圏） |
| [integration-guide.md](kit/integration-guide.md) | 既存 workflow との統合ガイド |
| [templates/](kit/templates/) | テーマ別テンプレート（5 種） |
| [DISCLAIMER.md](DISCLAIMER.md) | 免責事項・IP に関する注意 |
| [PUBLISHING.md](PUBLISHING.md) | npm メンテナ向けガイド |
| [paper/](paper/) | 学術論文・実験設計（会話劇によるフィクション含む） |

## ライセンス

MIT

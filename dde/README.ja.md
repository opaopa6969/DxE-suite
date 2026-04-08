# DDE toolkit — Document Deficit Extraction

[English](README.md) | [日本語](README.ja.md)

> 用語を全部抜き出して、誰でも分かる記事を作り、リンクにする。

## すぐ始める

Claude Code で話しかけるだけ:

```
--- 基本 ---
「DDE して」                    → ⚡ ドキュメント群選択 → 抽出 → 記事生成
「README.md を DDE して」        → ファイル指定で即開始

--- CLI（LLM 不要）---
npx dde-link README.md          # リンクを埋め込む
npx dde-link README.md --check  # リンク漏れチェック（CI 用、exit 1 で失敗）
npx dde-link README.md --dry-run # プレビュー（上書きなし）

--- メンテナンス ---
「DDE を更新して」               → toolkit 更新案内
```

## DDE のフロー

```
1. Select   — 対象ドキュメント群を選択（除外フォルダを確認）
              デフォルト除外: dde/, dge/, node_modules/
                ↓
2. Context  — 誰が読むかを把握（記事のトーン調整に使用。抽出フィルターには使わない）
                ↓
3. Length   — 記事の分量を設定（short / medium / long）
                ↓
4. Extract  — 全用語を一括抽出（レベルで絞らない）              ✦ LLM
              ↓ 用語一覧を確認・除外指定
5. Articleize — 1用語1ファイル・3セクション記事を生成           ✦ LLM
              → docs/glossary/<term>.md
                ↓
6. Link     — dde-link が同じドキュメント群にリンクを埋め込む   ✦ CLI
              → [用語](docs/glossary/xxx.md)（相対パス）
```

## 記事フォーマット — educational narrative

文字数ではなく**インテント**で指定する:

| インテント | 内容 |
|---|---|
| `educational` | 背景・動機・仕組みごと理解できる記事。例え話・図・なぜ？を含む（デフォルト） |
| `reference` | 定義と使い方を簡潔に。調べたい人向け |
| `deep-dive` | 実装詳細・コード例・エッジケースまで網羅 |
| 自由記述 | 「新入社員が業務背景ごと理解できるように」など |

```markdown
# JWT

## 一言で言うと？
ログイン情報を安全に持ち運ぶための小さな封筒のようなもの。

---

## パスポートのたとえ
空港でパスポートを見せると...（アナロジー）

---

## なぜ JWT が必要なの？
セッションで管理する場合との対比...（ASCIIダイアグラム）

---

## このプロジェクトでの使われ方
volta-auth-proxy が JWT を生成してヘッダーに...

---

## 具体的な例
1. ユーザーがログイン
2. サーバーが JWT を生成...

---

## さらに学ぶために
- [OAuth 2.0](oauth2.md) — JWT の発行フローで使われる
- [セッション管理](session-management.md) — JWT との比較
```

## dde-link の動作

```
1. docs/glossary/ の .md ファイル名から用語を自動推定
   jwt.md → ["JWT", "jwt"]
   session-management.md → ["session management", "Session Management"]

2. dictionary.yaml があれば上書き（日本語用語・別名対応）

3. 最長一致、段落ごとに 1 回 → [用語](docs/glossary/xxx.md) に置換

スキップ: コードブロック / インラインコード / 見出し / 既存リンク
```

## インストール

```bash
npm install @unlaxer/dde-toolkit
npx dde-install
```

インストール後のフォルダ構成:

```
dde/
├── method.md              ← DDE 方法論
├── flows/
│   └── quick.yaml         ← フロー定義
├── bin/
│   └── dde-tool.js        ← CLI ツール
├── sessions/              ← セッション出力（自動保存）
└── version.txt
docs/
└── glossary/              ← 用語集記事（1用語1ファイル・3セクション）
    ├── jwt.md
    ├── jwt.ja.md
    └── dictionary.yaml    ← 日本語・別名マッピング（任意）
.claude/
└── skills/
    ├── dde-session.md
    └── dde-update.md
AGENTS.md / GEMINI.md / .cursorrules
```

## DGE との関係

```
D*E シリーズ:
  DGE — Design-Gap Extraction       → 設計の穴を見つける（会話劇）
  DDE — Document-Deficit Extraction → ドキュメントの穴を見つける（LLM + CLI）
```

## 実績（volta-auth-proxy）

- 241 の用語集記事（120 EN + 121 JA）
- README に 334 のクリッカブルリンク
- 3 段階の読者レベル対応

## ライセンス

MIT License.

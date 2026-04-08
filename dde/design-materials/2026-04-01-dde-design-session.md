# DGE Session — DDE toolkit MVP 設計
- **Date**: 2026-04-01
- **Flow**: quick
- **Theme**: DDE (Document Deficit Extraction) toolkit の v0.1.0 設計
- **Characters**: ヤン, リヴァイ, 深澤, SaaS 専門家, 金八

---

## MVP Scope (v0.1.0)

### Module A: dde-link (CLI, LLM 不要)

```bash
npx dde-link README.md              # 自動リンク実行
npx dde-link README.md --check      # リンク漏れチェック（CI 用）
npx dde-link README.md --dry-run    # プレビュー
```

動作:
1. docs/glossary/ からファイル名 → 用語を自動推定
2. dictionary.yaml があれば上書き（日本語対応）
3. 文字数降順ソート（最長一致）
4. Markdown パース（unified + remark）
5. コードブロック/見出し/既存リンク スキップ
6. 段落ごとに最大 1 回マッチ
7. [用語](docs/glossary/xxx.md) に置換

### Module B: dde-session (Claude Code skill, LLM 必要)

```
「DDE して」→
  1. 対象ドキュメント特定
  2. 読者レベル選択（expert / beginner / grandma）
  3. LLM が用語抽出
  4. アーティクル生成（docs/glossary/ に保存）
  5. dde-link 呼び出し
```

### npx dde-install

```
.claude/skills/dde-session.md → Claude Code skill
docs/glossary/ → 空ディレクトリ作成（なければ）
```

---

## 未来 (v0.2.0+)

- 図の自動提案（mermaid 生成）
- 読者ギャップ検出
- 多言語同期（en/ja drift）
- CI GitHub Action

---

## 技術選択

```
言語: Node.js（npx で実行可能）
Markdown パーサー: unified + remark-parse + remark-stringify
YAML パーサー: yaml (npm)
テスト: vitest
パッケージ: @unlaxer/dde-toolkit
```

---

## ディレクトリ構造

```
DDE-toolkit/
  kit/
    package.json
    bin/
      dde-install.js
      dde-link.js
    lib/
      linker.js          ← 自動リンクのコアロジック
      dictionary.js      ← 辞書構築（自動推定 + YAML 上書き）
      markdown.js        ← Markdown パース + 置換
    flows/
      quick.yaml
    skills/
      dde-session.md     ← Claude Code skill
      dde-update.md
    templates/
      glossary-article.md
      glossary-beginner.md
      glossary-grandma.md
```

---

## Gap 一覧

| # | Gap | Severity |
|---|-----|----------|
| 1 | ファイル名 → 日本語用語の自動推定ができない。dictionary.yaml が必要 | 🟠 High |
| 2 | dictionary.yaml のスキーマ定義 | 🟠 High |
| 3 | 既存リンクの検出ロジック（[text](url) パターンの正確なパース） | 🟡 Medium |
| 4 | テーブルセル内の用語リンク化対応 | 🟡 Medium |
| 5 | --check の exit code 設計（CI 連携） | 🟡 Medium |
| 6 | DGE skill との共存（.claude/skills/ に両方入る） | 🟢 Low |
| 7 | volta-auth-proxy での実証テスト（283 記事 × 2 README） | 🟠 High |

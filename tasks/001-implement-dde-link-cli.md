# Task 001: dde-link CLI 実装

## 概要

DDE toolkit の Module A — 自動リンカー CLI を実装する。
LLM 不要。純コード。Node.js。

## 制約

- Node.js（npx で実行可能）
- 外部依存は最小限（unified, remark, yaml のみ）
- テストは vitest
- @unlaxer/dde-toolkit として npm publish 可能な構造

## 実装するもの

### 1. kit/bin/dde-link.js

```bash
# 使い方
npx dde-link <file> [options]

# オプション
--check       リンク漏れを検出（exit code 1 で失敗）
--fix         ファイルを上書き（デフォルト）
--dry-run     変更プレビュー（stdout に diff 出力）
--glossary    用語集ディレクトリ指定（デフォルト: docs/glossary/）
--lang        言語（auto / en / ja）。auto はファイル名で判定
--dictionary  辞書ファイルパス（デフォルト: docs/glossary/dictionary.yaml）
```

### 2. kit/lib/dictionary.js

```
機能:
  1. docs/glossary/ の全 .md ファイル名を収集（.ja.md は除外）
  2. ファイル名 → 検索用語マッピング（自動推定）
     jwt.md → ["JWT", "jwt"]
     multi-tenant.md → ["multi-tenant", "Multi-tenant", "multi tenant"]
     session-management.md → ["session management", "Session Management", "Session management"]
     → ハイフンをスペースに変換
     → 先頭大文字バリエーション
     → 全大文字バリエーション（3文字以下: JWT, XSS, SQL）
  3. dictionary.yaml があれば上書き
     → ja キーがあれば日本語用語を追加
  4. 文字数降順でソート（最長一致）
  5. 辞書オブジェクトを返す: { term: string, file: string, lang: string }[]
```

### dictionary.yaml フォーマット

```yaml
# docs/glossary/dictionary.yaml
# 自動推定で足りない用語を追加する

multi-tenant.md:
  en: ["multi-tenant", "multi-tenancy", "Multi-tenant"]
  ja: ["マルチテナント"]

session-management.md:
  en: ["session management"]
  ja: ["セッション管理"]

jwt.md:
  en: ["JWT", "JSON Web Token"]
  ja: ["JWT"]

saas.md:
  en: ["SaaS", "Software as a Service"]
  ja: ["SaaS"]

# 用語なしのファイル（リンク対象外）
# README.md: skip
```

### 3. kit/lib/markdown.js

```
機能:
  1. Markdown ファイルを unified + remark-parse でパース
  2. AST を walk
  3. テキストノードで用語マッチング
     - コードブロック (code, inlineCode) → スキップ
     - 見出し (heading) → スキップ
     - 既存リンク (link) の子テキスト → スキップ
     - テーブルヘッダ → スキップ
  4. 段落 (paragraph) ごとに用語を最大 1 回マッチ
     - マッチした箇所を link ノードに置換
  5. remark-stringify で Markdown に変換
  6. 変更箇所のカウントを返す
```

### 4. kit/lib/linker.js

```
機能: dictionary + markdown を組み合わせるオーケストレーター

  function link(filePath, options) {
    const lang = detectLang(filePath);  // .ja.md → ja, .md → en
    const dict = buildDictionary(options.glossaryDir, options.dictionaryPath, lang);
    const { content, changeCount } = processMarkdown(filePath, dict, lang);

    if (options.check) {
      // リンク漏れを表示
      return { unlinked: findUnlinked(filePath, dict), changeCount };
    }
    if (options.dryRun) {
      // diff を stdout に表示
      return { diff: createDiff(original, content), changeCount };
    }
    // ファイル上書き
    writeFile(filePath, content);
    return { changeCount };
  }
```

### 5. テスト (kit/__tests__/)

```
dictionary.test.js:
  - ファイル名 → 用語推定のテスト
  - ハイフン → スペース変換
  - 大文字バリエーション（JWT, XSS）
  - dictionary.yaml 上書きのテスト
  - 最長一致ソートのテスト

markdown.test.js:
  - コードブロック内はリンクされない
  - インラインコード内はリンクされない
  - 見出し内はリンクされない
  - 既存リンクは二重リンクされない
  - 段落ごとに 1 回だけリンク
  - テーブルセル内はリンクされる
  - 最長一致（"session management" > "session"）

linker.test.js:
  - --check でリンク漏れ検出
  - --fix でファイル更新
  - --dry-run で diff 表示
  - en/ja で正しいファイルにリンク

integration.test.js:
  - volta-auth-proxy の README.md で実行
  - 既存リンクを壊さない
  - 新しいリンクが正しく追加される
```

### 6. package.json

```json
{
  "name": "@unlaxer/dde-toolkit",
  "version": "0.1.0",
  "description": "Document Deficit Extraction — find what's not understood in your docs",
  "license": "MIT",
  "bin": {
    "dde-install": "bin/dde-install.js",
    "dde-link": "bin/dde-link.js",
    "dde-tool": "bin/dde-tool.js"
  },
  "dependencies": {
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "remark-stringify": "^11.0.0",
    "yaml": "^2.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  },
  "scripts": {
    "test": "vitest run"
  }
}
```

## 実装順序

```
1. dictionary.js + テスト（辞書構築）
2. markdown.js + テスト（Markdown パース + 置換）
3. linker.js + テスト（オーケストレーター）
4. dde-link.js（CLI エントリポイント）
5. volta-auth-proxy の README.md で統合テスト
6. dde-install.js（skill コピー）
7. package.json 整備
```

## 参照

- DDE 設計セッション: design-materials/2026-04-01-dde-design-session.md
- volta-auth-proxy の backlog: backlog/002-glossary-auto-linker.md
- DGE-toolkit の kit/ 構造を参考にする

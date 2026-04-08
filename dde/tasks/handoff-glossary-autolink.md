# Handoff: DDE に Glossary Auto-Link 機能を追加する提案

> From: volta-auth-proxy セッション (2026-04-07)
> To: DDE-toolkit

## 背景

volta-auth-proxy の README は全用語を `docs/glossary/*.md` にリンクしている（240+ 記事）。
現在は手動でリンクを貼っているが、記事数が 300 を超えると管理限界。

## 提案

DDE の「ドキュメントの穴を見つける」機能を拡張して、「glossary 用語の自動リンク化」も行えないか。

```
現在の DDE:
  入力: ドキュメント
  出力: 「ここが書いてない」リスト（deficit 検出）

拡張案:
  入力: ドキュメント + glossary ディレクトリ
  出力: deficit リスト + 用語リンク化 diff

  --check モード: リンク漏れを検出（dry-run）
  --fix モード: 自動リンク化
```

## 仕様メモ (volta-auth-proxy backlog/002 から)

- 最長一致（"session fixation" > "session"）
- 段落ごとに同じ用語は最大1回リンク
- コードブロック / インラインコード / 既存リンク / 見出し行はスキップ
- en/ja で対応するファイルにリンク
- 辞書は `docs/glossary/dictionary.yaml` or ファイル名から自動生成

## なぜ DDE に入れるのが自然か

- DDE は既にドキュメントをパースして分析する仕組みを持っている
- 「用語がリンクされていない」は一種の document deficit
- deficit 検出と auto-link を同じパイプラインで実行できる

## 参考

- volta-auth-proxy `backlog/002-glossary-auto-linker.md` に詳細仕様あり
- はてなブックマークのキーワード自動リンクが元ネタ

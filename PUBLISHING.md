# DGE-toolkit npm パッケージ管理ガイド

## 前提

- npm アカウントが必要: https://www.npmjs.com/signup
- パッケージ名 `dge-toolkit` が空いていること（公開前に確認）

## 初回公開

```bash
# 1. npm にログイン（ブラウザ認証）
npm login

# 2. kit/ ディレクトリに移動
cd kit/

# 3. パッケージ名の空きを確認
npm view dge-toolkit
# → 404 なら空き

# 4. 公開
npm publish

# 5. 確認
npm view dge-toolkit
```

## バージョンアップ

```bash
cd kit/

# パッチ（バグ修正、typo修正）: 1.0.0 → 1.0.1
npm version patch

# マイナー（新テンプレート追加、新キャラ追加）: 1.0.0 → 1.1.0
npm version minor

# メジャー（skill の構造変更、breaking change）: 1.0.0 → 2.0.0
npm version major

# 公開
npm publish
```

### バージョニングルール

| 変更内容 | バージョン |
|---------|-----------|
| typo 修正、文言微調整 | patch |
| テンプレート追加 | minor |
| キャラクター追加 | minor |
| method.md のセクション追加 | minor |
| skill の手順変更（既存フローに影響なし） | minor |
| skill の MUST ルール変更 | **major** |
| 出力フォーマット変更 | **major** |
| ファイル構成の変更（パス変更等） | **major** |

## kit/ とリポジトリの同期

kit/ 内のファイルはリポジトリのマスターからコピーされたもの。更新手順:

```bash
# method.md を更新した場合
cp method.md kit/method.md

# characters/catalog.md を更新した場合
cp characters/catalog.md kit/characters/catalog.md
# ※ IP 免責注記が kit/ 版にのみ存在する。上書き後に注記を再確認

# templates/ を更新した場合
cp templates/*.md kit/templates/

# 同期後、バージョンアップして公開
cd kit/
npm version minor
npm publish
```

## org scope を使う場合

プライベート感を出したい場合は org scope を使う:

```bash
# 1. npm org を作成（npm サイトで）
# 2. package.json の name を変更
#    "name": "dge-toolkit" → "name": "@your-org/dge-toolkit"
# 3. 公開（public にする場合は --access public を付ける）
npm publish --access public
```

ユーザーのインストールコマンドは `npm install @your-org/dge-toolkit` に変わる。

## 非公開テスト

公開前にローカルでテストする場合:

```bash
# kit/ をパック
cd kit/
npm pack
# → dge-toolkit-1.0.0.tgz が生成される

# 別のプロジェクトでインストール
cd /path/to/test-project
npm install /path/to/kit/dge-toolkit-1.0.0.tgz
npx dge-install
```

## 公開前チェックリスト

- [ ] `kit/package.json` の version が正しい
- [ ] `kit/README.md` の内容が最新
- [ ] `kit/method.md` がリポジトリの method.md と同期
- [ ] `kit/characters/catalog.md` が同期（IP 免責注記あり）
- [ ] `kit/templates/` が同期
- [ ] `kit/skills/dge-session.md` が最新
- [ ] `kit/LICENSE` が存在
- [ ] `npm pack` でテストしてインストールが動作する

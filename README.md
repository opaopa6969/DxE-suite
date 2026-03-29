# DGE — Dialogue-driven Gap Extraction

[English](README.en.md)

> "Spec review を何回しても見つからなかったことが、会話劇 10 分で出てきた。"

## DGE とは

**DGE** は 2 つの意味を持つ:

- **Design-Gap Exploration** — 設計の穴を探索する（何をするか）
- **Dialogue-driven Gap Extraction** — 対話で穴を抽出する（どうやるか）

仕様書のレビューは「書いてあることの検証」。
DGE は「書いてないことの発見」。

キャラクターが議論する会話劇を生成し、
仕様書にない前提、暗黙の制約、考慮漏れを表面化させる。

## 実績

- **unlaxer-parser** (SLE 2026 投稿予定): 5 sessions で 108 gaps を発見
- **AskOS**: 11+ sessions で 14,978 行の設計ドキュメントを生成、16 gaps を adversarial review で発見

## インストール

### npm

```bash
npm install @unlaxer/dge-toolkit
npx dge-install
```

`dge/` フォルダと `.claude/skills/` に skill ファイルがプロジェクトに作成されます。

### バージョンアップ

```bash
npm update @unlaxer/dge-toolkit
npx dge-update    # toolkit ファイルのみ上書き。sessions/ と custom/ は触らない
```

または Claude Code で「DGE を更新して」と言えば skill が案内します。

### ローカルから install（npm 未公開時）

```bash
# tarball から
cd kit && npm pack && cd ..
npm install ./kit/unlaxer-dge-toolkit-1.0.0.tgz
npx dge-install

# または直接パスから
npm install /path/to/DGE-toolkit/kit
npx dge-install
```

### 手動コピー（npm 不要）

```bash
cp -r kit/ your-project/dge/
cp kit/skills/*.md your-project/.claude/skills/
```

DGE-toolkit は MIT ライセンスです。`dge/LICENSE` をプロジェクトに含めてください。

### npm パッケージの管理

バージョニング、公開手順、同期方法は [PUBLISHING.md](PUBLISHING.md) を参照。

## 使い方

Claude Code で一言:

```
Human: 「認証 API の設計を DGE して」
```

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
```

## テーマ別の推奨組み合わせ

```
API 設計:        今泉 + 千石 + 僕
新機能企画:      今泉 + ヤン + 僕
セキュリティ:    千石 + Red Team + ハウス
Go/No-Go:       今泉 + 鷲津 + 僕
障害振り返り:    今泉 + 千石 + Red Team
```

## 今泉メソッド — 5 Types の問い

| Type | 問い | 発見するもの |
|------|------|------------|
| 1 | 「そもそも」 | 前提の未検証 |
| 2 | 「要するに」 | 本質の言語化 |
| 3 | 「他にないの」 | 暗黙の制約 |
| 4 | 「誰が困るの」 | 影響の不明確 |
| 5 | 「前もそうだった」 | 過去の失敗の想起 |

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [method.md](kit/method.md) | 方法論の全体（3分版 + 詳細 + クイックスタート） |
| [characters/catalog.md](kit/characters/catalog.md) | 12 キャラの一覧 + prompt + 使い分け |
| [characters/atlas.md](characters/atlas.md) | 文化圏別マッピング（英語圏・中国語圏の対応キャラ） |
| [characters/custom-guide.md](characters/custom-guide.md) | オリジナルキャラの作り方 |
| [templates/](kit/templates/) | テーマ別テンプレート（API設計、機能企画、Go/No-Go、障害振り返り、セキュリティ） |
| [gap-definition.md](gap-definition.md) | Gap の定義・分類・優先度計算 |
| [quality-criteria.md](quality-criteria.md) | 出力品質基準・チェックリスト |
| [limitations.md](limitations.md) | DGE の限界と注意点 |
| [DISCLAIMER.md](DISCLAIMER.md) | 免責事項・IP に関する注意 |
| [paper/](paper/) | 学術論文・実験設計（会話劇によるフィクション含む） |

## ライセンス

MIT

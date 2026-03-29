# DGE — Design-Gap Exploration / Dialogue-driven Gap Extraction

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

## クイックスタート

### 1. プロジェクトにコピー

```bash
# プロジェクトに dge/ フォルダをコピー
cp -r dge/ /path/to/your-project/dge/

# Claude Code の skills にコピー
cp dge/skills/*.md /path/to/your-project/.claude/skills/
```

### 2. Claude Code に「DGE して」と言う

```
Human: 「認証 API の設計を DGE して」
Agent: (dge/ を読む → テンプレート選択 → キャラ選択 → 会話劇生成 → gap 抽出)
```

### 3. Gap を Spec に変換

会話劇で発見された Gap が Use Case, API, Data Model に変換される。

## フォルダ構成

```
dge/
├── README.md              ← これ。最初に読む。
├── method.md              ← DGE の方法論（今泉メソッド、Observe→Suggest→Act）
├── characters/
│   ├── catalog.md         ← 12 キャラの一覧 + prompt + 使い分け
│   └── custom-guide.md    ← オリジナルキャラの作り方（自由入力対応）
├── templates/
│   ├── api-design.md      ← API 設計の DGE
│   ├── feature-planning.md← 新機能企画の DGE
│   ├── go-nogo.md         ← Go/No-Go 判断の DGE
│   ├── incident-review.md ← 障害振り返りの DGE
│   └── security-review.md ← セキュリティレビューの DGE
├── skills/
│   ├── dge-session.md     ← .claude/skills/ に置くと「DGE して」で発動
│   └── dge-template-create.md ← 新しいテンプレートを作る skill
└── examples/
    └── askos-adversarial.md ← 実際の DGE session 例（4 幕の大論戦）
```

## キャラクター早見表

```
前提が怪しい    → 👤 今泉   「そもそも聞いたんですか？」
品質が低い      → 🎩 千石   「お客様への侮辱です」
全部複雑        → ☕ ヤン   「要らなくない？紅茶ください」
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
VC 準備:         今泉 + 鷲津 + ラインハルト + 僕
障害振り返り:    今泉 + 千石 + Red Team
プロダクトレビュー: 大和田 + 利根川 + ハウス + ソウル
```

## 今泉メソッド — 5 Types の問い

DGE の最も強力な武器:

| Type | 問い | 発見するもの |
|------|------|------------|
| 1 | 「そもそも」 | 前提の未検証 |
| 2 | 「要するに」 | 本質の言語化 |
| 3 | 「他にないの」 | 暗黙の制約 |
| 4 | 「誰が困るの」 | 影響の不明確 |
| 5 | 「前もそうだった」 | 過去の失敗の想起 |

## ライセンス

MIT

# DGE Example: AskOS Adversarial Review（抜粋）

## 設定

```
テーマ: 「AskOS をサービスとして展開できるか？」
キャラクター:
  破壊者: 大和田常務, リヴァイ兵長, 利根川幸雄, Dr. ハウス
  守護者: 今泉, 千石, ヤン, 僕
Session 結果: 16 gaps 発見
```

## Scene 抜粋: 利根川がユーザーの本音を語る

```
先輩 (ナレーション):
  AskOS は "Decision Management Platform" として設計されている。
  月額 $19/Pro で SaaS 展開を検討中。
  既存の開発者ツール支出は月 $54 程度。

利根川: 開発者は「コードを書くツール」に金を払う。
    「判断を管理するツール」に金を払う開発者は
    この世に存在しない。
    
    なぜなら...
    判断は「自分の頭でやるもの」だと思っているからだ！
    
    お前たちは「判断の管理」という概念自体を売らなければならない。
    これは「ツール」を売るのではない。「文化」を売るのだ。

  → Gap 発見: プロダクトの語り方がユーザー目線ではない
  → Gap 発見: ユーザーは "Decision Management" という言葉を使わない

ラインハルト: 概念を理解させずに体験させればいい。
    Duolingo はユーザーに「第二言語習得理論」を教えない。

利根川: ...悪くない反論だ。
    「Decision Management」を売るな。
    「質問が減る体験」を売れ。

  → Spec implication: LP のヘッドラインを変更
    ✗ "Decision Management Platform"
    ✓ "AI agent への質問、もう答えなくていい"
```

## 発見された Gap（16 件）

```
ビジネス:  効果測定なし, 運用未設計, 大手参入リスク, GTM なし, pricing 未検証
安全性:    auto-answer timing gap, Decision 質の可視化なし, de-anonymization, SPOF
運用:      runbook ゼロ, OSS 品質検証なし, SLA 未定義
メッセージ: ユーザー目線の語り方, LP ヘッドライン
法的:      利用規約なし, compliance positioning
```

## この DGE で学んだこと

1. **破壊者キャラの価値** — 味方キャラだけでは甘い評価になる
2. **ダブルミーニングの発見** — Design-Gap Exploration と Dialogue-driven Gap Extraction が同時に成立
3. **Gap の分類が拡張された** — technical gap だけでなく business/ops/message/legal gap も
4. **meta 性** — DGE で DGE 自体を設計できる（AskOS が AskOS を DGE した）

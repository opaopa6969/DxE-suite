# DGE-toolkit フロー図

## 全体ワークフロー

設計課題を会話劇で掘り下げ、spec・usecase・architectureに落とすまでの流れ。

```mermaid
flowchart TD
    INPUT["設計課題・テーマ<br/>（spec / backlog / アイデア）"]
    TEMPLATE["テンプレート選択<br/>feature-planning / api-design<br/>go-nogo / incident-review ..."]
    FLOW["フロー選択<br/>design-review / tribunal<br/>brainstorm / investigation ..."]
    CHARS["キャラクター選択<br/>（批判役・専門家・悪魔の代弁者...）"]
    SESSION["会話劇セッション<br/>dge-session スキル実行"]
    GAPS["ギャップ抽出<br/>前提の穴 / 未定義の境界<br/>矛盾 / リスク"]
    SPEC["spec / ADR / usecase<br/>設計ドキュメントに反映"]
    DRE["DRE-toolkit へ<br/>rules / skills として積む"]

    INPUT --> TEMPLATE
    TEMPLATE --> FLOW
    FLOW --> CHARS
    CHARS --> SESSION
    SESSION --> GAPS
    GAPS --> SPEC
    SPEC -->|繰り返し精査| SESSION
    SPEC --> DRE
```

## セッションの内部フロー

```mermaid
flowchart TD
    BRIEF["ブリーフィング<br/>設計概要をキャラクターに共有"]
    ROUND["ラウンド開始<br/>各キャラクターが質問・指摘"]
    RESPONSE["設計者が回答・説明"]
    GAP{ギャップ検出？}
    LOG["ギャップを記録<br/>sessions/ に保存"]
    NEXT{次のラウンド？}
    SUMMARY["サマリー生成<br/>ギャップ一覧 + 推奨アクション"]

    BRIEF --> ROUND
    ROUND --> RESPONSE
    RESPONSE --> GAP
    GAP -->|Yes| LOG
    GAP -->|No| NEXT
    LOG --> NEXT
    NEXT -->|Yes| ROUND
    NEXT -->|No| SUMMARY
```

## DGE → DRE パイプライン

```mermaid
flowchart LR
    DGE_SESSION["DGEセッション<br/>会話劇でgap抽出"]
    SPEC["spec / usecase<br/>/ architecture"]
    DRE_RULES["DRE rules<br/>行動ルール化"]
    DRE_SKILLS["DRE skills<br/>スキル化"]
    PROJECT["プロジェクトに展開<br/>.claude/"]

    DGE_SESSION --> SPEC
    SPEC --> DRE_RULES
    SPEC --> DRE_SKILLS
    DRE_RULES --> PROJECT
    DRE_SKILLS --> PROJECT
```

# DGE Internals — 内部構造

DGE toolkit の内部構造。カスタマイズする際の参考に。

## フロー図

### 全体フロー（flow 自動判定 → 分岐）

```mermaid
flowchart TD
    Start(["DGE して"]) --> S0{"Step 0: flow 判定"}

    S0 -->|"DGE して / 壁打ち"| Quick["⚡ quick"]
    S0 -->|"詳しく / Spec / 設計レビュー"| Full["🔍 design-review"]
    S0 -->|"ブレスト / アイデア"| Brain["💡 brainstorm"]

    subgraph Quick Flow
        Q1["Kit 読み込み + dge-tool 検出"] --> Q2["テーマ確認"]
        Q2 --> Q4["キャラ表示（確認なし）"]
        Q4 --> Q5["会話劇生成"]
        Q5 --> Q7["保存（MUST）"]
        Q7 --> Q8["Gap 一覧 + 選択肢（MUST）"]
    end

    subgraph Design Review Flow
        D1["Kit 読み込み + dge-tool 検出"] --> D2["テーマ確認"]
        D2 --> D3["テンプレート選択"]
        D3 --> D35["パターン選択"]
        D35 --> D4["キャラ確認 ⏸"]
        D4 --> D5["会話劇生成"]
        D5 --> D6["Gap 構造化"]
        D6 --> D7["保存（MUST）"]
        D7 --> D8["Gap 一覧 + 選択肢（MUST）"]
    end

    subgraph Brainstorm Flow
        B1["Kit 読み込み + dge-tool 検出"] --> B2["テーマ確認"]
        B2 --> B4["キャラ確認 ⏸"]
        B4 --> B5["会話劇生成（Yes-and）"]
        B5 --> B7["保存（MUST）"]
        B7 --> B8["アイデア一覧 + 選択肢（MUST）"]
    end

    Quick --> Q1
    Full --> D1
    Brain --> B1
```

### 選択肢後の分岐

```mermaid
flowchart TD
    S8["サマリー + 選択肢 ⏸"] --> C1{"ユーザー選択"}

    C1 -->|"1. DGE を回す"| S9B["前回コンテキスト\n+ TreeView"]
    C1 -->|"2. 自動反復"| S9A["自動反復モード\n（最大 5 回）"]
    C1 -->|"3. 実装する"| S10["累積 Spec 化"]
    C1 -->|"4. 素の LLM マージ"| S9C["subagent\n素レビュー → マージ"]
    C1 -->|"5. 後で"| End([終了])

    S9B -->|テーマ選択| S2([Step 2 へ])
    S9A -->|未収束| S5([Step 5 へ])
    S9A -->|収束| S10
    S9C --> Merge["マージ結果表示 ⏸"]
    Merge -->|実装する| S10
    Merge -->|後で| End

    S10 --> Review{"Spec レビュー ⏸"}
    Review -->|OK| Impl([実装開始])
    Review -->|修正| S10
    Review -->|後で| End
```

⏸ = ユーザーの応答を待つポイント

## dge-tool モード

```mermaid
flowchart LR
    S1["Step 1:\ndge-tool version"] -->|成功| TM["🔧 Tool mode"]
    S1 -->|失敗| SM["📝 Skill mode"]

    TM --> S7T["Step 7: dge-tool save"]
    TM --> S8T["Step 8: dge-tool prompt"]

    SM --> S7S["Step 7: Write ツール"]
    SM --> S8S["Step 8: 内蔵選択肢"]

    S7T -->|失敗| S7S
    S8T -->|失敗| S8S
```

## データフロー図

```mermaid
flowchart LR
    subgraph Input["読み込み（Step 1）"]
        M[method.md]
        C[characters/catalog.md]
        CC[custom/characters/*.md]
        P[patterns.md]
        F[flows/*.yaml]
        PJ[projects/*.md]
        DT[dge-tool 検出]
    end

    subgraph Engine["DGE エンジン"]
        S0["Step 0: flow 判定"]
        S5["Step 5: 会話劇生成\n(flow.extract.marker)"]
        S10["Step 10: Spec 生成\n(flow.generate.types)"]
        S9C["Step 9C: subagent\n素 LLM マージ"]
    end

    subgraph Output["出力"]
        SE[sessions/*.md]
        SP[specs/*.md]
        MR[sessions/*-merged.md]
        PR[projects/*.md 更新]
    end

    M & C & CC & P --> S5
    F --> S0
    S0 --> S5
    PJ --> S5
    DT --> S5
    S5 --> SE
    S5 --> S10
    S5 --> S9C
    S10 --> SP
    S9C --> MR
    SE & SP & MR --> PR
```

## ステート図

```mermaid
stateDiagram-v2
    state "Flow ライフサイクル" as FL {
        [*] --> quick: デフォルト
        quick --> design_review: "詳しくやる"
        quick --> brainstorm: "ブレストして"
        design_review --> quick: "シンプルに戻す"
    }

    state "プロジェクト" as Project {
        [*] --> not_started
        not_started --> explored: DGE session 実行
        explored --> spec_ready: Spec 生成
        spec_ready --> implemented: 実装完了
    }

    state "Spec" as Spec {
        [*] --> draft: 自動生成
        draft --> reviewed: レビュー OK
        reviewed --> migrated: 正本に転記
    }

    state "自動反復" as AutoIter {
        [*] --> iterating: 開始
        iterating --> iterating: 新規 C/H Gap あり
        iterating --> converged: 新規 C/H Gap = 0
        iterating --> stopped: 上限到達（5 回）
        stopped --> iterating: "+3 回追加"
        converged --> [*]: Spec 化へ
    }
```

## 3 つの flow の比較

| | ⚡ quick | 🔍 design-review | 💡 brainstorm |
|---|---------|------------------|---------------|
| Steps | 5 | 10 | 6 |
| 共通 MUST | 3 | 3 | 3 |
| 固有 MUST | 0 | 4 | 1 |
| テンプレート | スキップ | 選択 | スキップ |
| パターン | 自動 | 選択 | 自動 |
| キャラ確認 | 表示のみ | 確認待ち | 確認待ち |
| 抽出 | Gap | Gap | アイデア |
| Spec 化 | なし | あり | なし |
| 話法 | 標準 | 標準 | Yes-and |

## Hook ポイント一覧

| Step | 名前 | Hook | Level | dge-tool |
|------|------|------|-------|----------|
| 0 | flow 判定 | trigger_keywords | 1（YAML） | — |
| 1 | Kit 読み込み | 読み込むファイル一覧 | 2 | version 検出 |
| 2 | テーマ確認 | 掘り下げロジック | 2 | — |
| 3 | テンプレート選択 | テンプレート追加 | 1（templates/） | — |
| 3.5 | パターン選択 | プリセット追加 | 1（patterns.md） | — |
| 4 | キャラ選択 | キャラ追加・推奨 | 1（custom/）/ 2 | — |
| 5 | 会話劇生成 | ナレーション・Scene | 2 | — |
| 6 | 抽出 | マーカー・カテゴリ | 1（YAML extract） | — |
| 7 | 保存 | 保存先・ファイル名 | 1（YAML output_dir） | **save** |
| 8 | 選択肢 | 選択肢構成 | 1（YAML post_actions） | **prompt** |
| 9A | 自動反復 | 収束判定・上限 | 2 | — |
| 9B | コンテキスト | TreeView・テーマ | 2 | — |
| 9C | LLM マージ | subagent 実行 | 2 | — |
| 10 | Spec 生成 | 成果物タイプ | 1（YAML generate） | — |

## ファイルマップ

| ファイル | 役割 | 誰が読む | 誰が書く |
|---------|------|---------|---------|
| method.md | メソッド本体 | Step 1 | toolkit 提供 |
| characters/catalog.md | built-in 19 キャラ | Step 1, 4 | toolkit 提供 |
| custom/characters/*.md | カスタムキャラ | Step 1, 4 | dge-character-create |
| patterns.md | 20 パターン + 9 プリセット | Step 1, 3.5 | toolkit 提供 |
| dialogue-techniques.md | 8 会話技法 | Step 5 | toolkit 提供 |
| flows/*.yaml | フロー定義 | Step 0, 6, 7, 8, 10 | toolkit 提供 or ユーザー |
| sessions/*.md | DGE session 出力 | Step 9B, 10 | Step 7（自動） |
| specs/*.md | Spec ファイル | 実装時 | Step 10（自動） |
| projects/*.md | プロジェクト管理 | Step 9B | Step 7（自動更新） |
| bin/dge-tool.js | MUST 強制 CLI | Step 1, 7, 8 | toolkit 提供 |

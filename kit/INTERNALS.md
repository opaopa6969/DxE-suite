# DGE Internals — 内部構造

DGE toolkit の内部構造。カスタマイズする際の参考に。

## フロー図

```mermaid
flowchart TD
    Start([DGE して]) --> S1["[1/10] Kit 読み込み"]
    S1 --> S2["[2/10] テーマ確認"]
    S2 --> S3["[3/10] テンプレート選択"]
    S3 --> S35["[3.5/10] パターン選択"]
    S35 --> S4["[4/10] キャラ選択 ⏸"]
    S4 --> S5["[5/10] 会話劇生成"]
    S5 --> S6["[6/10] 抽出（flow.extract）"]
    S6 --> S7["[7/10] ファイル保存 + プロジェクト更新"]
    S7 --> S8["[8/10] サマリー + 選択肢 ⏸"]

    S8 -->|"1. DGE を回す"| S9B["[9B] 前回コンテキスト + TreeView"]
    S8 -->|"2. 自動反復"| S9A["[9A] 自動反復モード"]
    S8 -->|"3. 実装する"| S10["[10/10] Spec 化（flow.generate）"]
    S8 -->|"4. 後で"| End([終了])

    S9B -->|テーマ選択| S2
    S9A -->|未収束| S5
    S9A -->|収束| S10

    S10 --> Review{"Spec レビュー ⏸"}
    Review -->|"1. OK"| Impl([実装開始])
    Review -->|"2. 修正"| S10
    Review -->|"3. 後で"| End
```

⏸ = ユーザーの応答を待つポイント

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
    end

    subgraph Engine["DGE エンジン"]
        S5["Step 5: 会話劇生成"]
        S6["Step 6: 抽出\n(flow.extract.marker)"]
        S10["Step 10: Spec 生成\n(flow.generate.types)"]
    end

    subgraph Output["出力"]
        SE[sessions/*.md]
        SP[specs/*.md]
        PR[projects/*.md 更新]
    end

    M & C & CC & P & F --> S5
    PJ --> S5
    S5 --> S6
    S6 --> SE
    S6 --> S10
    S10 --> SP
    SE & SP --> PR
```

## ステート図

```mermaid
stateDiagram-v2
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

## Hook ポイント一覧

各 Step でカスタマイズ可能なポイント。Level 1 は YAML / ファイル追加で変更可能。Level 2 は skill 編集（fork 推奨）。

| Step | 名前 | Hook | Level |
|------|------|------|-------|
| 1 | Kit 読み込み | 読み込むファイル一覧 | 2 |
| 2 | テーマ確認 | テーマの掘り下げロジック | 2 |
| 3 | テンプレート選択 | テンプレートの追加 | 1（templates/ にファイル追加） |
| 3.5 | パターン選択 | プリセットの追加・推奨マッピング | 1（patterns.md 編集） |
| 4 | キャラ選択 | キャラの追加・推奨ロジック | 1（custom/characters/）/ 2（推奨ロジック） |
| 5 | 会話劇生成 | ナレーション構造・Scene 構成 | 2 |
| 6 | 抽出 | マーカー・フォーマット・カテゴリ | 1（flows/ YAML の extract） |
| 7 | 保存 | 保存先・ファイル名規則 | 1（flows/ YAML の output_dir）/ 2 |
| 8 | 選択肢 | 選択肢の構成 | 1（flows/ YAML の post_actions） |
| 9A | 自動反復 | 収束判定・上限・ローテーション | 2 |
| 9B | コンテキスト維持 | TreeView・テーマ選択 | 2 |
| 10 | Spec 生成 | 成果物タイプ・テンプレート | 1（flows/ YAML の generate） |

## ファイルマップ

| ファイル | 役割 | 誰が読む | 誰が書く |
|---------|------|---------|---------|
| method.md | メソッド本体 | Step 1 | 手動（toolkit 提供） |
| characters/catalog.md | built-in キャラ | Step 1, 4 | 手動（toolkit 提供） |
| custom/characters/*.md | カスタムキャラ | Step 1, 4 | dge-character-create skill |
| patterns.md | 20 パターン + 5 プリセット | Step 1, 3.5 | 手動（toolkit 提供） |
| flows/*.yaml | フロー定義 | Step 1, 6, 8, 10 | 手動 or フロー wizard（v2） |
| sessions/*.md | DGE session 出力 | Step 9B, 10 | Step 7（自動） |
| specs/*.md | Spec ファイル | 実装時 | Step 10（自動） |
| projects/*.md | プロジェクト管理 | Step 9B | Step 7（自動更新） |

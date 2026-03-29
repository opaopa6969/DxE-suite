# DGE Session: Spec パイプラインの実装仕様

- **日付**: 2026-03-29
- **テーマ**: skill への Spec 化 MUST 追加、Spec テンプレート、integration-guide の具体的な記述内容
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル + ハウス + Red Team
- **テンプレート**: feature-planning.md ベース
- **前提**: gap-to-spec-pipeline.md の Gap 39-54 を踏まえた実装仕様の確定

---

## 実装仕様まとめ（確定）

### skill への追加 MUST ルール

```
MUST-7: 「実装する」を選んだ場合、Critical/High の Gap について
        Spec ファイルを dge/specs/ に生成してからでなければ実装に進まない。
        Medium 以下は SHOULD。Low は Action Item のみ。

MUST-8: dge/specs/ に生成する全ファイルの冒頭に DGE 生成警告ヘッダを入れ、
        status: draft のフロントマターを付与する。

MUST-9: DGE は dge/ 内にのみ書き込む。プロジェクトの docs/ や既存ファイルを
        直接変更しない。（CLAUDE.md への初回追記提案のみ例外）
```

### Spec テンプレート（5 種）

#### UC-[name].md — Use Case
```markdown
---
status: draft
source_session: [session ファイルパス]
source_gap: [Gap 番号]
---

<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。 -->

# UC-[name]: [タイトル]

## Trigger
[何がきっかけで発動するか]

## Actors
[誰が関わるか]

## Flow
1. [ステップ 1]
2. [ステップ 2]

## Exceptions
- [例外ケース]

## Acceptance Criteria
- [ ] [テスト可能な条件]
```

#### TECH-[name].md — Tech Spec
```markdown
---
status: draft
source_session: [session ファイルパス]
source_gap: [Gap 番号]
---

<!-- DGE 生成警告 -->

# TECH-[name]: [タイトル]

## 変更内容
[何を追加/変更するか]

## API（該当する場合）
METHOD /path
  Request: { ... }
  Response: { ... }

## Data Model（該当する場合）
CREATE TABLE ... / ALTER TABLE ...

## 影響範囲
[既存のどこに影響するか]
```

#### ADR-NNN-[name].md — Architecture Decision Record
```markdown
---
status: draft
source_session: [session ファイルパス]
source_gap: [Gap 番号]
---

<!-- DGE 生成警告 -->

# ADR-NNN: [タイトル]

## Context
[なぜこの決定が必要か]

## Options
### A: [選択肢 A]
- Pro: ...
- Con: ...

### B: [選択肢 B]
- Pro: ...
- Con: ...

## Decision
[未決定 — レビュー時に決定]

## Consequences
[決定した場合の影響]
```

#### DQ-[name].md — Design Question
```markdown
---
status: draft
source_session: [session ファイルパス]
source_gap: [Gap 番号]
---

<!-- DGE 生成警告 -->

# DQ-[name]: [質問]

## Context
[なぜこの質問が重要か]

## Options
- A: ...
- B: ...

## 決定期限
[いつまでに決める必要があるか。不明なら "未定"]
```

#### ACT-[name].md — Action Item
```markdown
---
status: draft
source_session: [session ファイルパス]
source_gap: [Gap 番号]
---

<!-- DGE 生成警告 -->

# ACT-[name]: [やること]

## 内容
[具体的な作業内容]

## 担当
[未定 — レビュー時にアサイン]
```

### Gap Category → 成果物マッピング

| Gap Category | 主要成果物 | 補助 |
|---|---|---|
| Missing logic | UC + TECH | — |
| Spec-impl mismatch | DQ | ADR |
| Type/coercion gap | TECH | — |
| Error quality | TECH | — |
| Integration gap | TECH | — |
| Test coverage | ACT | — |
| Business gap | ADR / DQ | — |
| Safety gap | TECH + ACT | — |
| Ops gap | ACT | — |
| Message gap | UC | — |
| Legal gap | ADR + ACT | — |

### 「実装する」選択時のフロー

```
1. Critical/High の Gap を抽出
2. マッピングに従い Spec を自動生成 → dge/specs/ に保存（status: draft）
3. Spec 一覧を表示
4. ユーザーに提示: レビューOK / 修正指示 / 後で
5. レビューOK → status を reviewed に自動更新 → 実装開始
6. 修正 → Spec を修正して再表示
7. 後で → draft のまま残す
```

### Spec ライフサイクル

```
draft → reviewed → migrated
         ↑ 修正     ↓ 正本への転記
         └────┘     migrated_to: docs/xxx.md
```

### Source of Truth ルール
- DGE の Spec と既存 docs が矛盾した場合、**既存 docs が Source of Truth**
- DGE Spec は提案にすぎない

---

## Gap 一覧（本 session 分）

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 55 | "レビューOK" の意味が曖昧（全Gap対応 vs 記録確定） | Message gap | Medium |
| 56 | Spec 生成後の選択肢フロー未定義 | Missing logic | **High** |
| 57 | status フロントマターの手動変更は非現実的 | Error quality | **High** |
| 58 | 既存 docs が Source of Truth であることの明記がない | Safety gap | **High** |

## Gap 詳細（High のみ）

### Gap-56: Spec 生成後の選択肢フロー
- **Observe**: Spec を生成した後、ユーザーが何をすればいいか不明
- **Suggest**: 3 択を提示: レビューOK / 修正指示 / 後で
- **Act**: skill Step 9「実装する」分岐にサブフローを追加

### Gap-57: status 変更の自動化
- **Observe**: ユーザーにフロントマター手動変更を期待するのは非現実的
- **Suggest**: 「レビューOK」で LLM が status を reviewed に自動更新
- **Act**: skill に自動更新ステップを追加

### Gap-58: Source of Truth の明記
- **Observe**: DGE Spec と既存 docs の優先順位が不明
- **Suggest**: integration-guide に明記
- **Act**: 「既存 docs が Source of Truth。DGE Spec は提案」を追加

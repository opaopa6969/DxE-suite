# TECH Spec: DVE Data Model v2

- **Status**: draft
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Resolves**: Gap #1, #2, #10, #11, #12, #13, #14, #15, #16

---

## Overview

DVE (Decision Visualization Engine) のコアデータモデル。DGE の出力（session, decision）をグラフ構造として表現し、因果チェーンの走査・未決定の検出・影響範囲分析を可能にする。

---

## Node Types

### Session

DGE セッションの実行記録。**immutable**（生成後は変更しない）。

```typescript
interface Session {
  id: string            // ファイル名ステム "2026-04-05-dve-design"
  date: string          // ISO date
  theme: string         // セッションテーマ
  flow: "quick" | "design-review" | "brainstorm"
  structure: "roundtable" | "tribunal" | "wargame" | "pitch" | "consult" | "investigation"
  characters: string[]  // ["今泉", "ヤン", "深澤", ...]
  file_path: string     // "dge/sessions/2026-04-05-dve-design.md"
}
```

**パースソース**: `dge/sessions/*.md`
- ファイル名から `date` + `id` を抽出
- frontmatter または冒頭のメタデータから `theme`, `flow`, `characters`

### Gap

セッション中に発見された設計上の穴。Session に内包されるが、独立ノードとして扱う（多対多リンクのため）。

```typescript
interface Gap {
  id: string            // "{session_id}#G-{n}" session scoped 連番
  session_id: string    // 親 Session の id
  summary: string       // Gap の要約テキスト
  category: string      // "missing-logic" | "spec-impl-mismatch" | "error-quality" | ...
  severity: "Critical" | "High" | "Medium" | "Low" | "Unknown"
  status: "Active" | "Void" | "Archived"
  line_ref: number      // session ファイル内の行番号
  discovered_by: string[] // Gap を発見したキャラ名（推定）
}
```

**ID 採番ルール**:
- session ファイル内の `→ Gap 発見:` マーカー出現順で G-001, G-002, ...
- session は immutable なので ID は冪等（何度パースしても同じ）
- 既存 ID（将来 DGE が出力する場合）があればそれを優先

**パースソース**: session ファイル内
- `→ Gap 発見:` マーカー → summary + line_ref
- Gap テーブル（あれば） → category + severity
- テーブルなし → severity: "Unknown"

### Decision

設計判断の記録。DGE セッションから生まれ、Gap を解決する。

```typescript
interface Decision {
  id: string            // "DD-001"
  title: string         // H1 見出し
  date: string          // ISO date
  rationale: string     // 判断の理由（本文から抽出）
  status: "active" | "overturned"
  supersedes: string[]  // ["DD-000"] — 置き換えた DD
  superseded_by: string[] // ["DD-012"] — 自身を置き換えた DD
  gap_refs: string[]    // ["2026-04-05-dve-design#G-001"]
  session_refs: string[] // ["2026-04-05-dve-design"]
  file_path: string
}
```

**パースソース**: `dge/decisions/DD-*.md`
- ファイル名から `id`
- frontmatter または本文から `Supersedes:`, `Session:`, `Gap:` フィールド

### Spec (Phase 2)

```typescript
interface Spec {
  id: string
  title: string
  type: "UC" | "TECH" | "ADR" | "DQ" | "ACT"
  status: "draft" | "reviewed" | "migrated"
  decision_refs: string[]
  migrated_to?: string   // "docs/api.md"
  file_path: string
}
```

**パースソース**: `dge/specs/*.md` — Phase 2 で実装

### Annotation

ユーザーが後から追加するコメント・異議・制約。Session/Gap/Decision に紐づく。

```typescript
interface Annotation {
  id: string            // "A-001"
  target: {
    type: "session" | "gap" | "decision"
    id: string
  }
  target_line?: number  // session 内の特定行（任意）
  author: string
  date: string          // ISO date
  body: string          // コメント本文
  action: "comment" | "fork" | "overturn" | "constrain" | "drift"
}
```

**action 種別**:
| action | 意味 | DD への影響 |
|--------|------|-------------|
| comment | 単なるコメント | なし |
| fork | ここから DGE 分岐 | なし |
| overturn | この決定を撤回 | status → overturned |
| constrain | 制約を追加 | ContextBundle に含まれる |
| drift | 現実と乖離 | ノードスタイル変更 |

**保存先**: `dve/annotations/*.md`
```markdown
---
target: DD-005
action: challenge
date: 2026-04-05
author: opa
---

セッション無効化の要件が追加された。JWT のステートレス前提を再検討すべき。
```

---

## Edge Types

```typescript
interface Edge {
  source: string        // ノード ID
  target: string        // ノード ID
  type: EdgeType
  confidence: "explicit" | "inferred"
  evidence?: string     // リンクの根拠
}

type EdgeType =
  | "discovers"    // Session → Gap (parse で自動)
  | "resolves"     // Gap → Decision (DD の Gap/Session フィールド)
  | "supersedes"   // Decision → Decision (DD の Supersedes フィールド)
  | "annotates"    // Annotation → any Node
  | "produces"     // Decision → Spec (Phase 2)
  | "implements"   // Spec → ExternalRef (Phase 2)
```

**confidence ルール**:
- `explicit`: DD ファイルに `Session:` や `Gap:` が明記されている
- `inferred`: テキストマッチで推定（Phase 2 の git-linker 等）
- Phase 1 では全リンクが `explicit`（推定リンクは Phase 2）

---

## Queries

```typescript
// 因果チェーン: DD から元の Session/Gap まで遡る
traceDecision(dd_id: string): CausalChain

// 前方影響範囲: ノードから影響を受ける全ノード
impactOf(node_id: string): Node[]

// 未解決 Gap: DD に紐づかない孤立 Gap (= DVE コアバリュー)
orphanGaps(): Gap[]

// 撤回 DD + 影響範囲
overturned(): { decision: Decision, impact: Node[] }[]
```

---

## Output Format: graph.json

```json
{
  "version": "1.0.0",
  "generated_at": "2026-04-05T12:00:00Z",
  "stats": {
    "sessions": 45,
    "gaps": 198,
    "decisions": 23,
    "annotations": 7
  },
  "nodes": [
    {
      "type": "session",
      "id": "2026-04-05-dve-design",
      "data": { "date": "2026-04-05", "theme": "DVE設計", "..." : "..." },
      "confidence": 1.0
    }
  ],
  "edges": [
    {
      "source": "2026-04-05-dve-design",
      "target": "2026-04-05-dve-design#G-001",
      "type": "discovers",
      "confidence": "explicit"
    }
  ],
  "warnings": [
    { "file": "dge/sessions/old.md", "message": "Gap markers not found (pre-v3)" }
  ]
}
```

---

## ContextBundle: DVE → DGE 橋渡し

```json
{
  "type": "dve-context-bundle",
  "version": "1.0.0",
  "origin": {
    "node_type": "gap",
    "node_id": "2026-04-01-auth#G-002",
    "file": "dge/sessions/2026-04-01-auth.md"
  },
  "summary": {
    "theme": "認証API設計",
    "date_range": "2026-03-01 ~ 2026-04-05",
    "prior_decisions": ["DD-003: JWT採用"],
    "prior_gaps": [
      { "id": "G-001", "summary": "トークンリフレッシュ未定義", "status": "Active" }
    ],
    "characters_used": ["今泉", "千石", "Red Team"],
    "session_count": 3
  },
  "new_constraints": ["セッション無効化の要件が追加"],
  "annotations": [],
  "suggested_action": "revisit",
  "prompt_template": "前回の認証API設計（DD-003: JWT採用）を再検討。\n制約追加: セッション無効化。\n前回 Gap: トークンリフレッシュ未定義。\nこの制約を踏まえて DGE して。"
}
```

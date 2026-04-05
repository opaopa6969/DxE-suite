# DD-002: DVE データモデル v2（Node 5 + Edge 6 + Query 4）

- **Date**: 2026-04-05
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Gap**: #1, #2, #10, #11, #13, #14, #15, #16

## Decision

DVE のデータモデルを以下の構成で確定する:

- **Node 5 種**: Session, Gap, Decision, Annotation, Spec(Phase 2)
- **Edge 6 種**: discovers, resolves, supersedes, annotates, produces(P2), implements(P2)
- **Query 4 種**: traceDecision, impactOf, orphanGaps, overturned

## Rationale

- Gap を Session の属性ではなく独立ノードにする: 1 つの Gap が複数 DD に影響し、複数 Session で再発見される（多対多）
- Annotation を別レイヤーにする: Session の immutability を維持しつつユーザーコメントを可能にする
- Gap ID は session scoped 複合キー `{session_id}#G-{n}`: Session が immutable なので冪等
- Edge に confidence (explicit/inferred) を持たせる: 明示リンクと推定リンクを区別

## Key Design Decisions

- **Session は immutable**: ログとして扱う。編集したいなら新 session を回す
- **DVE のコアバリュー = 未決定の可視化**: orphanGaps() で DD に紐づかない孤立 Gap を検出
- **DVE は DGE のハブ**: 6 つのユースケース（read, annotate, fork, constrain, overturn, context reconstruction）
- **ContextBundle**: DVE → DGE の橋渡しデータ。prompt_template を機械的に生成

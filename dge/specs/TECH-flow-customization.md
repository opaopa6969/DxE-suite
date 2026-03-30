---
status: implemented
source_session: design-materials/intake/flow-customization-design.md, flow-user-facing-design.md, customization-strategy.md, internal-architecture-design.md
source_gap: "#112-120, #122-128"
---

<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。 -->

# TECH-flow-customization: フロー定義 + 内部構造ドキュメント + カスタマイズガイド

## 成果物

1. kit/flows/design-review.yaml — デフォルトフロー定義
2. kit/INTERNALS.md — 3 図（フロー、データフロー、ステート）+ hook 一覧
3. kit/CUSTOMIZING.md — Level 1/2/3 カスタマイズガイド
4. skill の flows/ 読み込み（Step 1, 6, 10）
5. session 中の進捗表示 [Step N/10]

## Acceptance Criteria
- [ ] design-review.yaml が存在し、display_name 付きで全成果物タイプが定義されている
- [ ] INTERNALS.md に mermaid フロー図、データフロー図、ステート図がある
- [ ] CUSTOMIZING.md に Level 1/2/3 が記載されている
- [ ] flows/ YAML がなくても skill が従来通り動く（backward compatible）
- [ ] npm publish で kit/ に全ファイルが含まれる

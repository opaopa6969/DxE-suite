# DD-004: DVE は read-only viewer ではなく DGE のハブ

- **Date**: 2026-04-05
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Gap**: #12, #14, #21

## Decision

DVE は過去の決定を閲覧するだけのツールではなく、過去の文脈から新しい DGE セッションを起動するハブとして設計する。

## Rationale

ユーザーの実体験から:
- 20 プロジェクトを並行運用。決定後に会話を読み返すことがある
- 読んでいる途中で「ここ違う」と気づき、そこから DGE を再起動したい
- 制約を追加してやり直したい。どんでん返しも起きる
- 過去の session はコンテキストウィンドウにない。文脈の再構築が必要

## DVE → DGE Protocol

- **Phase 1 (inline)**: DVE が prompt_template を生成 → クリップボードコピー → ユーザーが DGE に貼る。DGE 側改修不要
- **Phase 2 (file ref)**: `context: dve/contexts/ctx-xxx.json` でファイル参照。DGE Phase 0 に読み込みロジック追加

**設計原則**: DVE は DGE に依存しない。DGE も DVE に依存しない。プロンプトテキストだけが接点。疎結合。

## 6 Use Cases

1. 決定の経緯を辿る (read)
2. 過去の会話にコメント (annotate)
3. 特定ポイントからやり直し (fork)
4. 制約追加で深掘り (constrained re-run)
5. どんでん返し (overturn) + 影響範囲可視化
6. コンテキスト復元 (context reconstruction)

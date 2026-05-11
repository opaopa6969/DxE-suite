# DD-006: Stop(LLM prompt) hook の削除と再導入条件

- **Date**: 2026-04-08（削除）/ 2026-04-25（ADR 化）
- **Commits**: `29cb1f7` (追加) → `3beb67f` (簡潔化) → `438aa23` (削除)
- **Related issue**: opaopa6969/issue-hub#84 / opaopa6969/DxE-suite#3, #4

## Decision

DRE の Stop(LLM prompt) hook を削除し、Stop hook は command (`stop-check.sh`) のみで構成する。

## Context / Rationale

### 経緯

| 日付 | コミット | 内容 |
|---|---|---|
| 2026-04-07 | `29cb1f7` | LLM prompt Stop hook を追加。`dre-config.json` の `stop_hook.llm_decision_review` で on/off 制御。会話全体を LLM が読み、暗黙の決定（「うん」「OK」「やって」等）を抽出することを意図 |
| 2026-04-08 | `3beb67f` | prompt 長過ぎによる JSON 非準拠回答の対策として prompt を簡潔化 |
| 2026-04-08 | `438aa23` | 簡潔化後も JSON 以外のテキストが返る問題が解消せず削除。PostToolUse / Stop の両方にエラー時フォールバックを追加 |

### 削除の根本原因

Claude Code の Stop(LLM prompt) hook は、LLM の返答を JSON として解釈する必要があるが、prompt を簡潔化しても非 JSON の散文を返すケースが残った。これにより Stop が誤ってブロック/パスとなる挙動が再現し、enforcement の信頼性を損なった。

### 現行体制（v4.2.0）

- PostToolUse: `post-check.sh` — Write/Edit 毎に DGE session 全文・DD Session ref・暗黙の決定パターンをチェック
- Stop (command): `stop-check.sh` — 会話終了時に `pending-decisions.json` の蓄積・session 保存・graph stale をチェック
- commit-msg: `commit-msg.sh` — DD 一覧表示 + `Ref: DD-NNN` 促進

command-only の Stop は「PostToolUse が蓄積した pending-decisions」を通じた間接的な検出であり、LLM による会話全文監査には劣る。ただし**決定的 / 再現可能 / コストゼロ**という利点がある。

## Consequences

### 許容するトレードオフ

- 口頭承認（「うん」「OK」「やって」）の大部分は、PostToolUse の決定パターン検出にヒットしない限り記録されない。
- これは DGE session / DVE annotation / 手動 DD 記録でカバーする運用とする。

### 設定と実装の乖離（2026-04-25 修正済）

- `dre-config.json` の `enforcement.level: "full"` / `stop_hook.llm_decision_review: true` は実装と乖離していた。
- 本 ADR 化と同時に `"lite"` / `false` に変更。

## Reintroduction Conditions（再導入条件）

Stop(LLM prompt) hook を再度有効化する場合、以下すべてを満たすこと:

1. **JSON 準拠の保証** — 構造化出力（tool-use or response_format: json_schema）を強制できる Claude Code / SDK バージョンを使用
2. **タイムアウト設定** — hook 内で呼ぶ LLM call に明示タイムアウト（例: 15 秒）を設定し、超過時は command hook のみでフォールバック
3. **コスト上限** — `dre-config.json` に `stop_hook.llm_max_tokens` / `stop_hook.llm_max_cost_per_day` を追加し超過時は自動 off
4. **idempotency** — 同一会話を複数回スキャンしても重複 DD を作らない dedupe-key ロジック
5. **デフォルト false** — 新規 install 時の `llm_decision_review` は false をデフォルトに。明示的な opt-in 運用
6. **回帰テスト** — 会話 fixture に対する snapshot テスト（抽出された決定一覧の hash）を `dre/kit/tests/` 配下に追加

## References

- 削除コミット本文（`438aa23`）: 「LLM prompt hook が JSON 以外を返す問題が解消しないため削除。command hook (stop-check.sh) が全チェックをカバー。PostToolUse/Stop 両方にエラー時のフォールバック追加。」
- 関連 issue: opaopa6969/DxE-suite#3（懸念点 §1）, opaopa6969/DxE-suite#4（改善提案 §1）

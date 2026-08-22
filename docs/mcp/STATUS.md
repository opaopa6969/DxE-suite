# DxE-suite MCP 化 STATUS（Phase 2）

> namespace: **`dxe`** | port: **9243** | host: 192.168.1.50 (prod) | state: **registered**

## 進捗サマリ

| フェーズ | 状態 | 備考 |
|---|---|---|
| Phase 1 調査 | done | survey.json / SURVEY.md |
| (A) 設計 | done | DESIGN.md（14 tools, resources, skills, 組み合わせ例） |
| (B) 協調 | done | issue-hub #379 (volta-mcp), #380 (dve-app 通告) |
| (C) 実装 | done | mcp/server.ts, mcp/test/e2e.test.ts, run.sh, deploy/, skills/ |
| (D) volta 参加 | done | svc_add, gateway_routes_apply, systemd 起動 |
| healthz | done | http://127.0.0.1:9243/healthz → 200 |
| gateway 経由 | done | https://dxe-suite-mcp.unlaxer.org/healthz → 200 |
| catalog | done | catalog__backend_status: namespace dxe = **ready** |

## テスト結果

```
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

- healthz 200 (name=dxe, version=4.2.0)
- tools/list 14 件（list_sessions, recommend_characters, list_patterns, record_session,
  get_graph, trace, impact, orphans, search, drift, status, clusters, build_context, annotate）
- annotations: read tools は readOnlyHint, annotate/record_session は destructiveHint
- dry-run: annotate/record_session は confirm:false で書き込まず plan を返す
- resources: dxe://spec (JSON, 14 capabilities), dxe://guide (markdown), skill://dxe-* (3 件)

## dry-run 記録

### svc_add (dry-run → confirm)
- exit: 0
- 新規エントリ dxe-suite-mcp（exists: false → 追加）
- port 9243, host 192.168.1.50, namespace dxe, min_role MEMBER
- warnings: dxe-suite-mcp に関するものは無し（既存サービスの警告のみ）
- confirm: true で実行 → 成功

### gateway_routes_diff
- 新規 1 件: `dxe-suite-mcp.unlaxer.org -> http://192.168.1.50:9243`
- 温存 8 件（既存の手動設定、影響なし）
- 自分の 1 件のみ追加 → gateway_routes_apply(confirm=true) → 成功

## prod deploy

1. prod(192.168.1.50) に `git clone`（shallow, branch docs/sync-with-code-2026-07-10）
2. `npm install`（workspaces に mcp を追加し依存解決を統一済み）
3. systemd unit `~/.config/systemd/user/dxe-suite-mcp.service` 配置
4. `systemctl --user enable --now dxe-suite-mcp` → active (running)
5. `curl http://127.0.0.1:9243/healthz` → 200
6. `curl https://dxe-suite-mcp.unlaxer.org/healthz` → 200（gateway 伝播に ~10s）
7. `catalog__reload` → namespace dxe = ready

## issue-hub

- [#379](https://github.com/opaopa6969/issue-hub/issues/379) — [mcp] dxe ↔ volta: namespace dxe の登録（from:DxE-suite, target:volta-mcp）
- [#380](https://github.com/opaopa6969/issue-hub/issues/380) — [mcp] dxe MCP が DVE graph データを共有（dve-app 通告）

## 未決事項 / open questions

- なし（Phase 1 の 4 つの open questions は全て DESIGN.md で暫定解決済み）
- issue-hub の返答待ちなし（暫定仕様で進行、返答があれば DESIGN を更新）

## コミット

- `f409ca7` feat(mcp): DxE-suite MCP サーバ実装（namespace dxe, port 9243）
- `361fc67` fix(mcp): mcp を npm workspaces に追加し依存解決を統一

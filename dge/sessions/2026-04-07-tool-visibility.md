# DGE Session: ツール可視性問題 — 存在するのに使われない

- **Date**: 2026-04-07
- **Flow**: quick
- **Structure**: roundtable
- **Characters**: 今泉, ヤン, リヴァイ, 僕
- **Rounds**: 1

## Scene 1: なぜ気づかない

**🧑‍💼 先輩**: DDE-toolkit に linker が実装・publish・skill 記載済みなのに volta-auth-proxy は Java で自前実装。

**☕ ヤン**: 3 つの理由。(1) skill は発動するまで読まれない (2) backlog で自前実装が決定済み (3) DDE update を回していない。

**⚔ リヴァイ**: push 型の通知がない。pull しない限り知らない。

→ Gap 発見: toolkit 新機能が push 通知されない。

## Scene 2: 重複実装の検出

**☕ ヤン**: DVE scan でプロジェクト内の自前実装もスキャンすべき。glossary-linker.java + DDE linker = 重複。

→ Gap 発見: 自前実装と toolkit の重複を検出する仕組みがない。

## Scene 3: 解決策

1. dxe update の changelog 通知 — 新機能を Slack 通知
2. dve scan --audit — 自前実装と toolkit の重複を検出
3. (将来) capability registry — backlog を scan して既存 toolkit で解決可能なものを提案

## Gap 一覧

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 1 | toolkit 新機能が push 通知されない | High | Active |
| 2 | 自前実装と toolkit の重複を検出する仕組みがない | High | Active |

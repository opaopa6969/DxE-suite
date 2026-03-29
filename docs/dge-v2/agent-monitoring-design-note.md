# Agent Monitoring — Design Note

Date: 2026-03-27

## 問題

AskOS に adopt した Claude Code エージェントの進捗が見えない。
`GET /api/agents/:id/logs` はほぼ空（起動コマンド2行のみ）。

## 現在の実装アプローチ（v0.5.0）

**tmux capture-pane ベースのスナップショット監視**

- stdout-watcher のポーリングサイクル内で `tmux capture-pane` を実行
- 前回スナップショットと hash を比較 → 変化あり/なしを判定
- `agent_screen_snapshots` テーブルに保存
- イベント:
  - `agent.screen_changed` — 変化検知
  - `agent.stale_screen` — N分間変化なし（ハング検知）
  - `agent.awaiting_instruction` — "Welcome back" 画面検知

**限界:**
- ポーリングベースなので最大30秒の遅延
- 画面の文字列を解析するため、Claude Code の UI が変わると壊れる可能性
- エージェントが CLAUDE.md の指示に従って `###EVENT:...###` を出してくれることに依存

---

## takt との比較

takt（https://github.com/nrslib/takt）は同じ問題を根本から違うアプローチで解決している。

| 観点 | takt | AskOS 現状 |
|------|------|-----------|
| エージェント起動 | orchestrator が subprocess として起動 | 外部の tmux セッションを adopt |
| stdout 取得 | パイプで直接受け取る | capture-pane で画面を覗く |
| 完了検知 | subprocess 終了（OS が保証） | マーカー文字列の解析 |
| 確実性 | 高（OS レベル） | 低〜中（文字列依存） |

takt が確実な理由: **orchestrator が agent を subprocess として「使う」**設計のため、
stdout は直接パイプで受け取れ、プロセス終了も OS が保証する。

AskOS が難しい理由: Claude Code は **インタラクティブな TUI** であり、
stdout をパイプできない。外から画面を覗くしかない。

---

## 改善案：`--output-format stream-json` モード

Claude Code には `--output-format stream-json` オプションがある。

```bash
claude --output-format stream-json --dangerously-skip-permissions
```

このモードでは TUI を出力せず、構造化された JSON ストリームを stdout に出力する。
takt と同様のアプローチが可能になる：

```
AskOS が JSON ストリームを直接パース
  → task.completed 相当のシグナルを確実に検知
  → ログを構造化して保存
  → 完了を OS レベルで把握（プロセス終了）
```

**メリット:**
- capture-pane 不要
- 確実な完了検知
- 構造化ログの保存が容易

**デメリット・検討事項:**
- TUI が使えなくなる（オペレーターが直接セッションを見られなくなる）
- stream-json の出力フォーマットの調査が必要
- 既存の adopt フロー（手動で起動した Claude Code セッションを取り込む）とは別の起動モードになる

---

## 現時点での方針

| ケース | アプローチ |
|--------|-----------|
| AskOS が起動するエージェント | `--output-format stream-json` モードを検討 |
| 手動で起動した既存セッションを adopt | capture-pane ベース（現実装）で継続 |

---

## 次のアクション候補

1. `--output-format stream-json` の出力フォーマットを調査・検証する
2. AskOS 管理下で起動するエージェントは stream-json モードで起動する実装を検討
3. adopt（手動セッション）と AskOS 管理起動を明確に分けた設計にする

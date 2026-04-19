[English version](getting-started.md)

# Getting Started

DxE-suite を 5 分で使い始めるためのガイド。

## 1. インストール

### オプション A — monorepo を直接使う（推奨）

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install
```

ルート `npm install` で `dge/kit` / `dge/server` / `dre/kit` / `dve/kit` が
hoist される。**`dde/kit` は workspaces 未登録**のため hoist されない。
`npx dxe install dde` 自体は CLI が `dde/kit/bin/dde-install.js` を
直接呼ぶので動作する。詳細は
[architecture-ja.md § 2.2](architecture-ja.md#22-既知のバグ--未登録項目)。

### オプション B — npm 経由（プロジェクト単位）

```bash
cd your-project
npm install --save-dev @unlaxer/dxe-suite
npx dxe install
```

CLI は自分が monorepo の中にいないことを検出し、npm から
`@unlaxer/dge-toolkit` / `@unlaxer/dre-toolkit` / `@unlaxer/dve-toolkit` を
取得してから、各 toolkit の `npx <tk>-install` を順に実行する。

## 2. 初回セットアップ

```bash
# 1. プロジェクトに skills / rules / hooks を展開（.claude/ + .dre/）
node bin/dxe.js install --yes

# 2. 使いたい skill を有効化（DRE はデフォルトで disabled/ に配置）
node bin/dxe.js activate all            # または: dge / dde / dre / dve

# 3. 現在のインストール状況確認
node bin/dxe.js status
```

`status` の期待出力:

```
  Mode: monorepo

  DGE: 4.2.0
  DDE: 4.2.0
  DRE: 4.2.0
  DVE: 4.2.0
```

## 3. 主要コマンド

```bash
# DGE 会話劇セッション（エージェントに依頼）
「DGE して」

# ドキュメントの穴を埋める（エージェントに依頼）
「DDE して」

# 決定グラフ可視化
npx tsc -p dve/kit/tsconfig.json
node dve/kit/dist/cli/dve-tool.js build
cd dve/app && npm install && npx vite build && npx vite preview
# → http://localhost:4173

# ワークフロー状態確認
node dre/kit/engine/engine.js status
```

## 4. シェルエイリアス（推奨）

`.bashrc` / `.zshrc` に追加:

```bash
DXE_HOME="$HOME/work/AskOS-workspace/DxE-suite"
alias dxe="node $DXE_HOME/bin/dxe.js"
alias dve="node $DXE_HOME/dve/kit/dist/cli/dve-tool.js"
alias dre-engine="node $DXE_HOME/dre/kit/engine/engine.js"
alias dve-serve="dve serve --watch"
alias dve-build="dve build"
alias dve-scan="dve scan"
alias dve-status="dve status"

# 便利ワンライナー
dxe-install() {
  node "$DXE_HOME/bin/dxe.js" install --yes \
    && node "$DXE_HOME/dre/kit/engine/engine.js" init 2>/dev/null
}
dve-up() {
  npx tsc -p "$DXE_HOME/dve/kit/tsconfig.json"
  dve build
  (cd "$DXE_HOME/dve/app" && npx vite build)
  dve serve --watch
}
```

## 5. Claude Code での hook 有効化

`dxe install` が次を書き込む:

- `.claude/settings.json` — PostToolUse + Stop + commit-msg hook を登録
  （Stop の LLM prompt 版が入っていない理由は
  [ADR-0001](decisions/0001-remove-stop-llm-prompt-hook.md)）
- `.dre/hooks/*.sh` — hook スクリプト本体

Claude Code は `.claude/settings.json` から自動で読み込む。
PostToolUse と Stop はいずれもエラーフォールバック付き
（`… 2>/dev/null || true` または `|| echo '{"ok": true}'`）になっているので、
hook が壊れてもセッションは止まらない。その 1 回のチェックが落ちるだけで済む。

## 6. Slack 通知の有効化

```bash
export DRE_NOTIFY_URL="https://hooks.slack.com/services/..."
```

`.dre/dre-config.json`:

```json
{
  "notifications": {
    "channel": "slack",
    "min_level": "critical"
  }
}
```

レベル: `critical`（enforcement 違反・Stop ブロック・DD 覆し）/
`daily`（pending decisions・孤立 Gap・drift）/
`info`（graph stale・build 完了）。

DVE の Slack **bot**（slash コマンド、インタラクティブボタン）は
[slack-setup.md](slack-setup.md) を参照。

## 7. 次に読むもの

- [アーキテクチャ](architecture-ja.md) — 何がどこにあるか、なぜか
- [CHANGELOG](../CHANGELOG.md) — 何がいつ変わったか、なぜか
- [dde-toolkit からの移行](migration-from-dde-toolkit-ja.md) — 既存 DDE 環境がある場合
- [ADR 一覧](decisions/) — 記録された決定

# DRE-toolkit

**Document Rule Engine** — Claude Code の rules / skills / agents / commands / profiles を npm パッケージとして配布・管理するツールキット。

DGE-toolkit（Dialogue-driven Gap Extraction）、DDE-toolkit と並ぶ兄弟プロジェクト。AskOS はこのツールキットを利用するアプリケーションのひとつ。

## コンセプト

Claude Code プロジェクトの設定は今まで手動コピーで広めるしかなかった。DRE-toolkit はこれを npm パッケージ化し、`npx dre-install` 一発で展開できるようにする。

```
新プロジェクト
  └─ npx @unlaxer/dre-toolkit dre-install
       ├─ .claude/rules/     ← 展開
       ├─ .claude/skills/    ← 展開
       ├─ .claude/agents/    ← 展開
       ├─ .claude/commands/  ← 展開
       └─ .claude/profiles/  ← 展開
```

## 構造

```
DRE-toolkit/
├── kit/          # npm パッケージ (@unlaxer/dre-toolkit)
│   ├── rules/
│   ├── skills/
│   ├── agents/
│   ├── commands/
│   ├── profiles/
│   └── templates/
├── dre/          # 作業コピー（開発中の最新版）
├── design-materials/
├── docs/
├── paper/
├── server/
└── sessions/
```

## インストール

```bash
npx @unlaxer/dre-toolkit dre-install
```

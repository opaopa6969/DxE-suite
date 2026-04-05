# DRE-toolkit — Document Rule Engine

> Claude Code の rules / skills / agents / commands / profiles を npm パッケージとして配布・管理する。

## すぐ始める

```bash
# 新プロジェクトに展開
npm install @unlaxer/dre-toolkit
npx dre-install

# アップデート
npm update @unlaxer/dre-toolkit
npx dre-update
```

展開先:

```
.claude/
├── rules/      ← ルール定義
├── skills/     ← スキル定義
├── agents/     ← エージェント定義
├── commands/   ← スラッシュコマンド
└── profiles/   ← プロファイル
```

## なにができるか

**Claude Code 設定を npm で配布**
ESLint shareable config と同じ発想。`npx dre-install` 一発でチーム全員が同じルールセットで動く。

**バージョン管理**
`npx dre-update` で新バージョンの rules/skills を取得。カスタマイズ済みファイルはスキップ。

**DGE → DRE パイプライン**
DGE の会話劇 → spec → DRE で rules 化 → npm publish → 新プロジェクトへ展開。

## Claude Code からの操作

インストール後、Claude Code に話しかけるだけ:

```
「DRE を更新して」   → バージョン確認 + アップデート案内
```

## 構成

```
kit/
├── rules/      ← プロジェクトに展開される rules
├── skills/     ← プロジェクトに展開される skills（dre-update.md 含む）
├── agents/     ← プロジェクトに展開される agents
├── commands/   ← プロジェクトに展開される commands
├── profiles/   ← プロジェクトに展開される profiles
├── templates/  ← rules/skills のテンプレート
├── samples/    ← サンプル
├── bin/        ← dre-tool CLI
├── install.sh  ← npx dre-install の実体
└── update.sh   ← npx dre-update の実体
```

## dre-tool CLI

```bash
dre-tool status    # インストール済みファイルとバージョンを表示
dre-tool list      # kit に含まれるファイル一覧
dre-tool version   # バージョン表示
```

## DxE-suite との関係

```
DxE-suite (@unlaxer/dxe-suite)
  ├─ DGE-toolkit  (設計の穴を抽出)
  ├─ DDE-toolkit  (ドキュメントの穴を補完)
  └─ DRE-toolkit  (rules/skills/agents を展開)  ← これ
```

## ライセンス

MIT

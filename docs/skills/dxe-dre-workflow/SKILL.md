---
name: dxe-dre-workflow
description: DRE ワークフローを初期化・運用する手順（init → transition → hooks）
volta:
  version: 2
  namespace: dxe
  locality: repo
  applies_when: "DRE を導入したい／workflow phase を進めたい"
  requires:
    tools:
      - dxe__status
  min_role: VIEWER
  export: true
  tags:
    - dre
    - workflow
    - hooks
---
# DRE ワークフロー運用

1. `dxe dre init` → 対象プロジェクトに DRE をインストール
2. `dxe dre transition <phase>` → phase を進める（spec→implementation→stabilization→maintenance）
3. `dxe__status` で現在の phase と DRE install state を確認
4. hooks が commit-msg / PostToolUse で DD-NNN 記録と gap 保存を強制

詳細: `dre/kit/README.md`

## 関連

- `dxe://spec`（能力仕様）
- `dxe://guide`（lifecycle 全体）
- リポジトリ: https://github.com/opaopa6969/DxE-suite

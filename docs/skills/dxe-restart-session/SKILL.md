---
name: dxe-restart-session
description: ContextBundle から DGE 再開プロンプトを組み立てて壁打ちを再起動する手順
volta:
  version: 2
  namespace: dxe
  locality: repo
  applies_when: "DGE を再開したい／未決 gap から壁打ちを再起動したい"
  requires:
    tools:
      - dxe__build_context
      - dxe__list_sessions
  min_role: VIEWER
  export: true
  tags:
    - dge
    - dve
    - restart
---
# DGE セッションの再開

1. `dxe__list_sessions` で過去セッション一覧を取得
2. 再開したいセッションの gap や決定を確認
3. `dxe__build_context` に `originId`（session/gap/decision ノード ID）を渡す
4. 返った `prompt_template` を使って DGE を再開

origin が gap なら deep_dive、session なら revisit、constraints を渡せば new_angle になる。

## 関連

- `dxe://spec`（能力仕様）
- `dxe://guide`（lifecycle 全体）
- リポジトリ: https://github.com/opaopa6969/DxE-suite

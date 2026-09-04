# DD-007: DVE distribution must fail closed

**Date:** 2026-09-05
**Session:** [2026-09-05-dve-distribution-readiness](../sessions/2026-09-05-dve-distribution-readiness.md)
**Gap:** Gap 1–4

## Decision

DVEのnpm配布物はbuild済みruntimeを明示的に含め、実tarballからCLIをsmoke testする。installer、update、CIはcompileまたは初回graph buildが失敗した場合にnon-zeroで終了し、成功を表示しない。

## Rationale

DVEはDGE/DDE/DREの状態と決定を可視化し、途中再開の入口になる。そのCLIが配布物で起動しない、または失敗を成功扱いする状態では、追加のhealth表示より前に製品価値が失われる。データモデルや利用者成果物を変えず、build/package/install境界だけを厳格化するため、小さく可逆である。

## Alternatives considered

- `dxe status`へ包括的health modelを追加する: 有効だが、DVE CLI自体の起動不能を先に直す必要があるため次回へ送る。
- 失敗を警告だけにする: 壊れた状態で成功扱いが残るため却下。
- tramli/tramli-appspec: 処理が同期的・短時間・再実行可能で、外部待ち、人間介入、長時間transaction、永続resumeを必要としないため不採用。

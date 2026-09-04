# DGE Session: DVE distribution readiness

- **Date:** 2026-09-05
- **Flow:** roundtable
- **Theme:** DGE/DDE/DVE/DRE 導入者が壊れ・古さ・途中再開を安全に見抜けるか
- **Characters:** 今泉（前提）、ヤン（簡素化）、深澤（利用者）、千石（運用）、リヴァイ（保守）、Red Team（失敗時）
- **Evidence:** README、コード、テスト、git history、GitHub issues/PRs、`npm pack` とCLIの実測

## Context

先輩: 「DxE-suite は DGEでgapを発見し、DVEで決定と再開文脈を可視化し、DREでhookを強制し、DDEで文書不足を補う。しかし `@unlaxer/dve-toolkit` の `bin.dve` は存在しないJSを指し、`npm pack` にruntime JSがない。installerとCIはbuild失敗を握り潰す。」

## Scene 1 — 利用者

深澤: 「READMEどおり `dve status` を叩いた導入者には失敗しか見えません。しかもinstallerは成功と言う。この瞬間に製品への信頼が消えます。」
  → Gap 発見: 公開DVE packageのCLI entrypointと梱包物が一致せず、導入直後の主要体験が成立しない

今泉: 「賛成です。そもそも状態を見る道具が起動しないなら、壊れた状態、古い状態、途中再開を誰が見抜くんですか？」
  → Gap 発見: 状態診断より手前の配布契約が未検証

ヤン: 「二人に賛成です。新しい診断基盤より先に、既存CLIを正しくbuildしてtarballから一回起動する。20%の工数で入口の80%を守れます。」

## Scene 2 — 運用者と失敗時

千石: 「利用者の指摘に賛成します。compileもgraph buildも失敗を捨て、最後にinstalledと言う。それは成功ではありません。失敗ならnon-zeroで止まるのが最低基準です。」
  → Gap 発見: installer/update/CIがDVE build失敗を隠し、壊れた導入をgreenにする

Red Team: 「千石に賛成。不完全な `dist/` directoryだけ残せばcompileを回避できます。欠損でも改ざんでも同じです。」
  → Gap 発見: `dist/` の存在だけを完全性の証拠として信頼している

ヤン: 「同意。ただしhash manifestは今回要らない。常にbuildし、失敗を伝播すれば十分です。」

## Scene 3 — 保守者と契約ドリフト

リヴァイ: 「全員に賛成だ。package.json、TypeScript出力、installer、CIが別々の前提で動いている。実tarballを隔離環境にinstallし、runtime import一式と `dve version` をテストしろ。」
  → Gap 発見: source-tree testだけで実配布tarballのruntime contractを検証していない

今泉: 「賛成です。でもhook説明差分やstatusのfalse-greenもあります。誰が困る順ですか？」

千石: 「packagingは全利用者を入口で止めます。hookやresume整合性もHighですが別の意味単位です。まず配布をfail-closedにするべきです。」

深澤: 「同意します。今回の完了条件は『インストールできたふりをしない』『配布物だけでCLIが動く』までなら明快です。」

## Scene 4 — 境界・互換性・自己適用

Red Team: 「空dist、部分dist、compile失敗、graph build失敗を試します。tarballはrepo外へ入れ、偶然sourceを読んでいないことも確認します。」

リヴァイ: 「賛成。既存のcommandと出力は壊すな。失敗系、tarball境界、CLI互換性をtestにする。」

ヤン: 「tramli/tramli-appspecは使わない。同期的なbuild→pack→smokeで、外部イベント待ち、人間介入、長時間transaction、途中再開が本質ではない。失敗後は再実行できる。」

今泉: 「同意します。自己適用DGEが成果物を増やすこと自体を価値と誤認しないよう、採用理由は実測した配布障害と独立tarball testに限定しましょう。」

## Gap 一覧

| # | Gap | Category | Severity |
|---|---|---|---|
| 1 | DVE packageのCLI entrypoint/梱包物がruntimeと不一致 | Integration gap | Critical |
| 2 | installer/update/CIがbuild失敗を成功扱い | Safety gap | High |
| 3 | 不完全な`dist/`を完成済みと誤認 | Missing logic | High |
| 4 | 配布tarballの独立smoke testがない | Test coverage | High |
| 5 | `dxe status`が導入先でなくsource versionを表示し、partial/outdated/brokenを判定しない | Ops gap | High |
| 6 | DRE resume contextのunknown phase/substate/stack不整合を黙って受理する | Safety gap | High |
| 7 | hook/CLI/READMEに契約ドリフトがある | Spec-impl mismatch | Medium |

## Observe / Suggest / Act

### Gap 1–4 — 今回採用

- **Observe:** 公開物のCLIが起動不能になり得る一方、導入とCIは成功表示する。
- **Suggest:** build済みruntimeを配布し、install/update/CIをfail-closed化し、実tarballを隔離smoke testする。
- **Act:** [TECH-DVE-DISTRIBUTION-01](../specs/dve-distribution-readiness.md) を実装する。

### Gap 5–7 — 今回は保留

- **Observe:** 壊れ・古さ・resume不整合、およびhook/docs driftを統合表示できない。
- **Suggest:** 次の意味単位としてread-only health modelを設計する。
- **Act:** 今回のissueへ混ぜず、配布入口が安定した後のDGE対象にする。

## Decision

最大価値で小さく安全・可逆な1改善として、DVE npm配布・installer・CIのfail-closed化とtarball smoke testを選ぶ。tramli/tramli-appspecは不採用とする。

## Next actions

1. **採用:** Gap 1–4を1 issue / 1 PRで実装する。
2. Gap 5–6をhealth診断の次回DGEへ送る。
3. Gap 7をdocs/hook契約整理の次回DGEへ送る。
4. 何もしない。

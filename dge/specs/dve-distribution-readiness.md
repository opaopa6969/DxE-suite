# TECH-DVE-DISTRIBUTION-01: Fail-closed DVE package and installation

> DGE-generated draft. Human review is required before implementation.

- **Status:** draft
- **Session:** [2026-09-05-dve-distribution-readiness](../sessions/2026-09-05-dve-distribution-readiness.md)
- **Decision:** [DD-007](../decisions/DD-007-dve-distribution-fail-closed.md)
- **Issue:** [#37](https://github.com/opaopa6969/DxE-suite/issues/37)
- **Resolves:** Gap 1–4

## Change

1. 公開CLIをTypeScript build出力へ向け、pack前にclean buildする。
2. CLIと全runtime importをtarballへ含める。
3. install/updateはcompileと初回graph buildの失敗を伝播する。
4. CIのworkspace buildは失敗を伝播する。
5. 生成tarballを一時projectへinstallしてpublic CLIを実行するtestを追加する。

## Compatibility

- `dve version` のcommand名と出力を維持する。
- DGE session、DD、annotation、graph schemaを変更しない。
- 既存設定や利用者データを上書き・削除しない。
- source checkoutからのTypeScript buildを維持する。

## Acceptance criteria

- [ ] tarballにpublic CLIと全runtime依存JSが含まれる。
- [ ] 空または不完全な既存`dist/`に依存せずpackはclean buildする。
- [ ] tarballをrepo外の一時projectへinstallし、package提供の`dve version`がexit 0になる。
- [ ] compile/graph build失敗時、installer/updateはnon-zeroで終了し成功表示を出さない。
- [ ] CI workspace buildはfailureを伝播する。
- [ ] 失敗系・tarball境界・CLI後方互換性testが通る。
- [ ] 必要なbuildと全workspace testが通る。lint scriptがない場合は記録する。

## Out of scope

- `dxe status`のCURRENT/OUTDATED/PARTIAL/BROKEN/RESUMABLE model
- DRE contextのphase/substate/stack整合性診断
- hookとREADMEの契約ドリフト修正
- graph schema/UI変更

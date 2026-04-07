# DGE Session: 演劇技法の DGE 統合

- **Date**: 2026-04-07
- **Flow**: quick
- **Structure**: roundtable
- **Characters**: 今泉, ヤン, 深澤, リヴァイ
- **Rounds**: 1

## Scene 1: 何を入れて何を入れないか

*—— DxE-suite リポジトリ、演劇技法カタログを前にして ——*

**🧑‍💼 先輩**: 演劇論のレビューが入った。40+ 技法。全部入れたら method.md が倍になる。

**☕ ヤン**: *カタログをパラパラめくり、紅茶を置く。* 全部は要らない。最も効果が高く、実装コストが低い 3 つに絞る。

**👤 今泉**: そもそも、今の DGE で一番足りないのは何ですか？

**🎨 深澤**: 読んでいて退屈なこと。全シーンが同じ会議室で同じトーン。キャラの人格が対話に出てこない。

**☕ ヤン**: Phase 1 の 3 つ: (1) method.md に演出指示 (2) キャラファイルに backstory + speech_pattern (3) patterns.md に Category D。

**👤 今泉**: history_with は？

**☕ ヤン**: Phase 2。キャラが多すぎて組み合わせ爆発する。

→ Gap 発見: history_with は Phase 2。Phase 1 は backstory + speech_pattern に絞る。

## Scene 2: output_format は Phase 1 に入れるか

**🎨 深澤**: ずんだもん型、法廷劇型...Phase 1 に入れたい。

**⚔ リヴァイ**: 入れるな。flow YAML + skill 分岐 + テンプレート。工数 3 倍。

**☕ ヤン**: Phase 2。既存 roundtable の中で演出技法を使う。フォーマットを変えずに中身を変える。

→ Gap 発見: output_format は Phase 2。

## Scene 3: enforcement — 演出を使わせる仕組み

*—— 深澤が立ち上がる ——*

**🎨 深澤**: method.md にルールを書いても守られなかったのが MUST #1。演出指示も同じ運命では？

*全員が黙る。*

**☕ ヤン**: *膝を打つ。* Stop hook の LLM prompt に 1 行足す。「演出技法が最低 1 つ使われていますか？」

→ Gap 発見: 演出技法の enforcement — Stop hook LLM prompt に追加。

## Gap 一覧

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 1 | history_with は Phase 2 | Medium | Deferred |
| 2 | output_format は Phase 2 | Medium | Deferred |
| 3 | 演出技法の enforcement — Stop hook LLM prompt | High | Active → 実装中 |

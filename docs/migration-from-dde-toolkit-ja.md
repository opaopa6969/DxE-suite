[English version](migration-from-dde-toolkit.md)

# `@unlaxer/dde-toolkit`（単独版）から DxE-suite への移行

4.1.0 以前の DDE は、独立した npm パッケージとして提供されていた:

```bash
npm install --save-dev @unlaxer/dde-toolkit
npx dde-install
```

4.1.0 以降、DDE は DxE-suite の一部になった
（[ADR-0002](decisions/0002-archive-dde-into-monorepo.md)）。
本ガイドは移行手順を示す。**データは一切失われない** —
`docs/glossary/` / `dde/sessions/` / `dde/flows/` のレイアウトは不変。

## 1. インストール方式を選ぶ

### モード A — monorepo

DxE-suite を clone し、そこから DDE を使う。DGE / DRE / DVE も一緒に
使うプロジェクトに最適。

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install
node bin/dxe.js install dde --yes
node bin/dxe.js activate dde
```

### モード B — プロジェクト単位の npm（後方互換）

単独 DDE npm パッケージのまま、あるいは DxE-suite アンブレラに乗り換える。
単独パッケージは引き続き公開されており、monorepo 版と API 互換。

```bash
# B1 — 単独パッケージ維持（移行作業なし、ただし DxE 統合体験は得られない）
npm install --save-dev @unlaxer/dde-toolkit
npx dde-install

# B2 — DxE-suite アンブレラ CLI を使う
npm install --save-dev @unlaxer/dxe-suite
npx dxe install dde
```

## 2. ディスク上の変化

**ない。**どの方式でも同じレイアウトが展開される:

```
dde/
├── method.md
├── flows/quick.yaml
├── bin/dde-tool.js
├── sessions/
└── version.txt
docs/
└── glossary/
    ├── jwt.md
    ├── jwt.ja.md
    └── dictionary.yaml
.claude/
└── skills/
    ├── dde-session.md
    └── dde-update.md
```

monorepo モードでは `.claude/skills/disabled/` 配下にも配置される
（DRE の流儀 —
[README § 既知の問題](../README-ja.md#既知の問題) 参照）。

## 3. CLI の変化

| 旧（単独版） | 新（monorepo / アンブレラ） | 備考 |
|---|---|---|
| `npx dde-install` | `npx dxe install dde` | monorepo なら `node bin/dxe.js install dde` |
| `npx dde-tool …` | `npx dde-tool …`（不変） | `dde-tool` は今も `dde/kit/bin/` |
| `npx dde-link …` | `npx dde-link …`（不変） | `dde-link` は今も `dde/kit/lib/` |
| — | `npx dxe activate dde` | **新** — DDE skill を一括有効化 |
| — | `npx dxe deactivate dde` | **新** — DDE skill を一括無効化 |
| — | `npx dxe update` | 4 toolkit を一括更新 |

`dde-tool` / `dde-link` のバイナリ名は**変更されていない**。
CI で `npx dde-link README.md --check` を叩いていても、そのまま動く。

## 4. バージョン番号の変化

monorepo 統合前は DDE が `0.1.x` で DGE / DRE / DVE が `4.x` という
ずれた状態だった。4.2.0 以降、**4 toolkit すべてが同一バージョン**。

`package.json` で DDE をピンしている場合:

```diff
  "devDependencies": {
-   "@unlaxer/dde-toolkit": "^0.1.8",
+   "@unlaxer/dde-toolkit": "^4.2.0",
    "@unlaxer/dxe-suite":   "^4.2.0"
  }
```

プロジェクト内で `dxe status` を叩くと、4 toolkit すべてが揃った
バージョンで出る — それが期待値。ずれていたら何かがおかしい。

## 5. DDE のデータはどこに行ったか

短く言えば **どこにも行っていない**。monorepo は `docs/glossary/` /
`dde/sessions/` / `dde/flows/` を**プロジェクトごと**の成果物として扱う
（単独版と同じ）。DxE-suite をインストールしても、用語集が
`DxE-suite/dde/` にコピーされることは**ない**。配布されるのは
skills + CLI だけで、プロジェクト側の `.claude/` と `dde/kit/` 近辺に
配置される。

## 6. 衝突に注意

`dde/kit` を `package.json` `workspaces` に追加する未来の作業
（[architecture-ja.md § 2.2](architecture-ja.md#22-既知のバグ--未登録項目) 参照）
では、DDE の `bin` エントリが `node_modules/.bin/` に hoist される。
事前に確認すべき名前:

- `dde-install` — DDE 固有
- `dde-tool` — DDE 固有
- `dde-link` — DDE 固有

いずれも DGE / DRE / DVE の bin 名（`dge-*`・`dre-*`・`dve-*`・`dxe`）と
被らない。作業着手時点の main で最終確認すること。

## 7. ロールバック手順

monorepo 統合で問題が起きた場合:

```bash
# 1. monorepo インストールされた skill を無効化
npx dxe deactivate dde

# 2. workspaces 編集済みなら dde/kit の hoisting を解除
#    — 4.2.0 時点では dde/kit は未登録なので不要

# 3. 単独パッケージを再インストール
npm install --save-dev @unlaxer/dde-toolkit@^0.1
npx dde-install
```

`docs/glossary/` への影響はない。

## 8. FAQ

**Q. 上流の `@unlaxer/dde-toolkit` repo をそのままソースとして使える？**
はい。上流 repo は read-only ですがリリースは維持される。
`dde-link --check` だけ使う CI なら、何も変える必要はない。

**Q. DDE が monorepo から乖離することはある？**
ない。4.2.0 以降、monorepo が truth の源泉。
`@unlaxer/dde-toolkit` の単独リリースは monorepo の subtree split で行う。

**Q. なぜ `dde/kit` が `workspaces` に入っていない？**
既知の統合バグ。
[ADR-0002 § Mitigations](decisions/0002-archive-dde-into-monorepo.md#mitigations)
と [architecture-ja.md § 2.2](architecture-ja.md#22-既知のバグ--未登録項目) を参照。
`npx dxe install dde` は CLI が DDE installer を直接呼ぶため動作する。

## 関連

- [ADR-0002 — DDE を monorepo に統合](decisions/0002-archive-dde-into-monorepo.md)
- [アーキテクチャ](architecture-ja.md)
- [CHANGELOG](../CHANGELOG.md)

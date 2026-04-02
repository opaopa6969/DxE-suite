# DRE-toolkit フロー図

> 現状 v0.1.0 の実装を反映。未実装・将来機能は明示。

---

## 1. 全体ワークフロー

DGE で設計 → DRE で rules 化 → npm 配布 → プロジェクト展開。

```mermaid
flowchart TD
    DGE["DGE-toolkit\n会話劇 → gap → spec"]
    DRE_DEV["dre/ に rules/skills/agents/\ncommands/profiles を作成"]
    KIT["kit/ にコピーしてパッケージング"]
    NPM["npm publish\n@unlaxer/dre-toolkit"]
    INSTALL["npx dre-install\n新プロジェクトに展開"]
    PROJECT[".claude/\n├ rules/\n├ skills/\n├ agents/\n├ commands/\n└ profiles/"]
    UPDATE["npx dre-update\nバージョンアップ時"]

    DGE -->|spec → rules 化| DRE_DEV
    DRE_DEV -->|cp dre/* kit/*| KIT
    KIT --> NPM
    NPM --> INSTALL
    INSTALL --> PROJECT
    PROJECT -->|改善フィードバック| DRE_DEV
    NPM --> UPDATE
    UPDATE -->|新規ファイルのみ追加| PROJECT
```

---

## 2. インストール状態の遷移

`.claude/.dre-version` の有無とバージョン差分で状態が決まる。

```mermaid
stateDiagram-v2
    [*] --> FRESH : .claude/ なし
    FRESH --> INSTALLED : npx dre-install 実行
    INSTALLED --> OUTDATED : kit バージョン > ローカル
    INSTALLED --> CUSTOMIZED : ユーザーが .claude/ 内を編集
    OUTDATED --> INSTALLED : npx dre-update 実行
    CUSTOMIZED --> INSTALLED : update 実行（編集済みファイルはスキップ）
    CUSTOMIZED --> OUTDATED : kit バージョン更新
```

| ステート | 条件 | `.dre-version` |
|---------|------|---------------|
| FRESH | `.claude/` が存在しない | なし |
| INSTALLED | インストール済み・最新 | kit と一致 |
| OUTDATED | kit のバージョンが新しい | kit より古い |
| CUSTOMIZED | ユーザーがファイルを編集済み | 一致するが diff あり |

---

## 3. install.sh の詳細フロー

**トリガー**: `npx dre-install [target_dir]`

**読み込み**:
- `kit/version.txt` — 配布バージョン
- `kit/rules/*.md`, `kit/skills/*.md`, `kit/agents/*.md`, `kit/commands/*.md`, `kit/profiles/*.md`

**書き出し**:
- `.claude/rules/`, `.claude/skills/`, `.claude/agents/`, `.claude/commands/`, `.claude/profiles/`
- `.claude/.dre-version` — バージョン記録

```mermaid
flowchart TD
    START["npx dre-install"]
    RESOLVE["SRC を解決\nnode_modules/ or kit/"]
    MKDIR["mkdir -p .claude/{rules,skills,agents,commands,profiles}"]
    COPY_LOOP["各ディレクトリをループ\nrules / skills / agents / commands / profiles"]
    FILE_EXISTS{"対象ファイルが\n.claude/ に存在?"}
    SKIP["スキップ\n（既存を保護）"]
    COPY["ファイルをコピー"]
    VERSION["echo SRC_VERSION > .claude/.dre-version"]
    DONE["Done! v{version} installed."]

    START --> RESOLVE
    RESOLVE --> MKDIR
    MKDIR --> COPY_LOOP
    COPY_LOOP --> FILE_EXISTS
    FILE_EXISTS -->|Yes| SKIP
    FILE_EXISTS -->|No| COPY
    SKIP --> COPY_LOOP
    COPY --> COPY_LOOP
    COPY_LOOP -->|全ファイル処理完了| VERSION
    VERSION --> DONE
```

**ルール**:
- `.gitkeep` はコピーしない
- 既存ファイルは上書きしない（初回インストール保護）
- 失敗しても残ったファイルは保持される（set -euo pipefail）

---

## 4. update.sh の詳細フロー

**トリガー**: `npx dre-update [target_dir]`

**読み込み**:
- `kit/version.txt` — 配布バージョン
- `.claude/.dre-version` — ローカルバージョン
- 各 kit ファイルと `.claude/` 対応ファイルの diff

**書き出し**:
- 新規ファイルのみ `.claude/` に追加
- `.claude/.dre-version` を更新

```mermaid
flowchart TD
    START["npx dre-update"]
    RESOLVE["SRC を解決"]
    CHECK_DIR{".claude/ が\n存在するか？"}
    ERROR["Error: dre-install 先に実行"]
    VERSION_CHECK{"SRC_VERSION ==\nLOCAL_VERSION?"}
    ALREADY["Already up to date."]
    SCAN["各ファイルをスキャン\ndiff -q で比較"]
    REPORT_SKIP["[skip] カスタマイズ済み"]
    REPORT_NEW["[new] 新規ファイル"]
    CONFIRM["更新しますか？ [y/N]"]
    CANCELLED["キャンセル"]
    DO_UPDATE["新規ファイルのみコピー\nカスタマイズ済みはスキップ"]
    UPDATE_VER[".dre-version を更新"]
    DONE["Updated to v{version}"]

    START --> RESOLVE
    RESOLVE --> CHECK_DIR
    CHECK_DIR -->|No| ERROR
    CHECK_DIR -->|Yes| VERSION_CHECK
    VERSION_CHECK -->|同じ| ALREADY
    VERSION_CHECK -->|異なる| SCAN
    SCAN --> REPORT_SKIP
    SCAN --> REPORT_NEW
    REPORT_SKIP --> CONFIRM
    REPORT_NEW --> CONFIRM
    CONFIRM -->|N| CANCELLED
    CONFIRM -->|Y| DO_UPDATE
    DO_UPDATE --> UPDATE_VER
    UPDATE_VER --> DONE
```

**ルール**:
- バージョンが同じなら何もしない
- `diff -q` で差異があるファイル（＝カスタマイズ済み）はスキップ
- `.claude/` に存在しない新規ファイルのみ追加
- 実行前にユーザー確認必須（`read -p`）
- `--force` フラグ: **未実装**（将来: カスタマイズ済みも強制上書き）

---

## 5. dre-tool CLI のフロー

**トリガー**: `dre-tool <command>`

```mermaid
flowchart LR
    CMD["dre-tool"]
    STATUS["status\n読み: .claude/.dre-version\n     kit/version.txt\n出力: バージョン差分 + ファイル数"]
    LIST["list\n読み: kit/{rules,skills,...}/\n出力: kit に含まれるファイル一覧"]
    SAVE["save <file>\n読み: stdin\n出力: ファイルに書き込み"]
    VERSION["version\n出力: dre-tool バージョン"]

    CMD --> STATUS
    CMD --> LIST
    CMD --> SAVE
    CMD --> VERSION
```

**未実装コマンド**（将来）:
- `dre-tool export --cursor` — `.cursor/rules/` に変換出力
- `dre-tool export --codex` — `AGENTS.md` に DRE セクションを出力
- `dre-tool export --gemini` — `GEMINI.md` に出力

---

## 6. dre-update スキル（Claude Code 内）

**トリガー**: 「DRE を更新して」「dre update」「ルールを更新して」

**読み込み**:
- `.claude/.dre-version`
- `node_modules/@unlaxer/dre-toolkit/version.txt`

**出力**（Claude が生成）:
- バージョン比較表示
- 更新対象ファイル一覧
- ユーザー確認 → `npx dre-update` 実行案内

```mermaid
flowchart TD
    TRIGGER["「DRE を更新して」"]
    CHECK_LOCAL[".claude/.dre-version を読む"]
    CHECK_KIT["node_modules/.../version.txt を読む"]
    SHOW_VERSIONS["現在 vX.X.X → 更新元 vY.Y.Y を表示"]
    EXPLAIN["更新内容を説明\n（カスタマイズ済みはスキップ）"]
    WAIT["ユーザー確認を待つ\n← MUST: 勝手に実行しない"]
    RUN["npx dre-update を案内 or 実行"]
    REPORT["完了報告"]

    TRIGGER --> CHECK_LOCAL
    CHECK_LOCAL --> CHECK_KIT
    CHECK_KIT --> SHOW_VERSIONS
    SHOW_VERSIONS --> EXPLAIN
    EXPLAIN --> WAIT
    WAIT -->|承認| RUN
    WAIT -->|拒否| CANCELLED["キャンセル"]
    RUN --> REPORT
```

**MUST ルール**:
1. 更新前に必ずユーザーの確認を得る
2. カスタマイズ済みファイルには触らない
3. npm が見つからない場合は手順を案内する

---

## 7. DRE 開発フロー（メンテナー向け）

rules/skills を追加・更新して publish するまでの流れ。

```mermaid
flowchart TD
    DEV["dre/ でルール・スキルを開発"]
    TEST["ローカルで動作確認\nbash kit/install.sh /tmp/test-project"]
    SYNC["dre/* → kit/* にコピー"]
    BUMP["npm version patch/minor/major"]
    PUBLISH["npm publish --access public"]
    COMMIT["git commit + git push"]

    DEV --> TEST
    TEST -->|OK| SYNC
    SYNC --> BUMP
    BUMP --> PUBLISH
    PUBLISH --> COMMIT
```

**バージョニングルール**:

| 変更内容 | バージョン |
|---------|-----------|
| typo 修正、文言微調整 | patch |
| rules/skills ファイル追加 | minor |
| install.sh / update.sh の動作追加 | minor |
| ファイルパス変更、構造変更 | **major** |
| install.sh / update.sh の MUST ルール変更 | **major** |

---

## 8. クロスツール変換（将来・未実装）

DRE rules を正典として他ツール形式に変換する。

```mermaid
flowchart LR
    RULES["kit/rules/\n（正典）"]
    CLAUDE[".claude/rules/\nClaude Code"]
    CURSOR[".cursor/rules/\nCursor"]
    CODEX["AGENTS.md\nCodex"]
    GEMINI["GEMINI.md\nGemini CLI"]

    RULES -->|dre-tool export --claude| CLAUDE
    RULES -->|dre-tool export --cursor| CURSOR
    RULES -->|dre-tool export --codex| CODEX
    RULES -->|dre-tool export --gemini| GEMINI
```

---

## 9. 現状サマリー（v0.1.0）

| コンポーネント | 状態 | 備考 |
|-------------|------|------|
| install.sh | ✅ 実装済み | 基本動作 OK |
| update.sh | ✅ 実装済み | --force 未実装 |
| dre-tool.js | ✅ 実装済み | export 系は未実装 |
| skills/dre-update.md | ✅ 実装済み | ja/en |
| kit/rules/ | ⬜ 空 | v0.3.0 で AskOS から収録予定 |
| kit/skills/ | ⬜ dre-update.md のみ | |
| kit/agents/ | ⬜ 空 | |
| kit/commands/ | ⬜ 空 | |
| kit/profiles/ | ⬜ 空 | |
| extends 継承機構 | ❌ 未設計 | v0.2.0 課題 |
| クロスツール変換 | ❌ 未実装 | 将来機能 |

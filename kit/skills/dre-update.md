<!-- DRE-toolkit (MIT License) -->

# Skill: DRE toolkit アップデート

## Trigger
ユーザーが以下のいずれかを言ったとき:
- 「DRE を更新して」
- 「DRE をアップデートして」
- 「dre update」
- 「ルールを更新して」（DRE インストール済みのプロジェクトで）

## 手順

### Step 1: 現在のバージョンを確認
`.claude/.dre-version` を読んでローカルバージョンを表示する。
ファイルがなければ「バージョン情報がありません（v0.1.0 以前のインストールです）」と表示。

### Step 2: 更新元を特定
以下の優先順で更新元を探す:
1. `node_modules/@unlaxer/dre-toolkit/version.txt` — npm install 済みの場合
2. ユーザーに更新元のパスを聞く — npm を使っていない場合

npm の場合は `node_modules/@unlaxer/dre-toolkit/version.txt` と `.claude/.dre-version` を比較して表示:
```
現在: v0.1.0
更新元: v0.2.0
```

### Step 3: 更新内容を説明
以下を表示してユーザーに確認する:

```
以下のファイルが更新されます（カスタマイズ済みはスキップ）:
- .claude/rules/*.md
- .claude/skills/*.md
- .claude/agents/*.md
- .claude/commands/*.md
- .claude/profiles/*.md

カスタマイズしたファイルは上書きされません。
新規追加ファイルのみコピーされます。

更新しますか？
```

**ユーザーの確認を待つ。**

### Step 4: 更新を実行
ユーザーが承認したら:

npm の場合:
```bash
npm update @unlaxer/dre-toolkit
npx dre-update
```

手動の場合:
kit ファイルを `.claude/` に手動コピーする手順を案内する。

### Step 5: 結果を報告
```
DRE toolkit を v[新バージョン] に更新しました。
カスタマイズ済みファイルは変更されていません。
```

## MUST ルール
1. **更新前に必ずユーザーの確認を得る。** 勝手に上書きしない。
2. **カスタマイズ済みファイルには触らない。** スキップして新規ファイルのみ追加。
3. **更新元が見つからない場合は `npm update @unlaxer/dre-toolkit` の手順を案内する。**

## 注意
- npm を使っていないユーザーには手動コピーの手順を案内する。
- `.claude/.dre-version` がない場合は v0.1.0 以前とみなす。

---
status: implemented
source_session: design-materials/intake/project-navigation-design.md
source_gap: "#93, #92, #95, #97"
---

<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。
     既存 docs と矛盾する場合、既存 docs が Source of Truth です。 -->

# TECH-project-file-system: プロジェクトファイルシステム

## 変更内容

DGE session を「プロジェクト > テーマ > セッション」の 3 層で管理する仕組みを追加。

### 1. ディレクトリ

```
dge/projects/           ← プロジェクトファイルを格納
```

install.sh の `mkdir -p` に `${DGE_DIR}/projects` を追加。

### 2. プロジェクトファイルフォーマット

`dge/projects/{project-name}.md`:

```markdown
---
project: [プロジェクト名]
created: YYYY-MM-DD
status: in_progress
---

## テーマ

### [テーマ名]
- status: not_started | explored | spec_ready | implemented
- sessions:
  - dge/sessions/xxx.md
- gaps: N (Critical: X, High: X, Medium: X, Low: X)
- spec_status: pending | generated | reviewed
```

### 3. 自動作成ルール

- 初回 session: プロジェクトファイルなし（通常の DGE）
- 2 回目以降: 「既存のプロジェクトに追加しますか？」と確認
  - Yes → プロジェクト選択 → テーマ選択
  - No → 「プロジェクト名を付けますか？」
    - Yes → 新規プロジェクト作成
    - No → スタンドアロン session

### 4. 自動更新

session 保存時（Step 7）にプロジェクトファイルを更新:
- テーマの session リストに追加
- Gap 数を再集計
- status を更新（not_started → explored）

### 5. TreeView 表示（Step 9B）

```
## プロジェクト: [name]

├── ✅ テーマ A（N sessions, Gap: C/H/M/L）
│   └── Spec: generated
├── ⬜ テーマ B
└── ⬜ テーマ C

テーマを選んでください:
1. テーマ A → 深掘り or Spec 化
2. テーマ B → 新規 DGE
3. テーマ C → 新規 DGE
4. 新しいテーマを追加
```

マーク: ✅ explored / ⬜ not_started / 🔶 spec_ready / ✔ implemented

### 6. 後方互換

プロジェクトファイルがなくても skill は動く。既存の session は影響なし。

## 影響範囲

- kit/install.sh: `dge/projects/` 作成追加
- kit/update.sh: `dge/projects/` を保護対象に追加
- kit/skills/dge-session.md: Step 7 に自動更新、Step 9B に TreeView
- skills/dge-session.md: 同上（intake/ 版）

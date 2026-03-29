# DGE Session: プロジェクトレベルナビゲーション

- **日付**: 2026-03-30
- **テーマ**: 複数テーマを持つプロジェクトのナビゲーション — TreeView、進捗マーク、テーマ間遷移
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル + Red Team + 大和田
- **テンプレート**: feature-planning.md
- **パターン**: zero-state + expertise-contrast

---

## 設計決定

### 3 層構造
```
プロジェクト > テーマ > セッション
```

### プロジェクトファイル
- 場所: `dge/projects/{project-name}.md`
- 内容: テーマ一覧 + 各テーマの status/sessions/gaps
- 更新: session 保存時（Step 7）に自動更新
- 作成: 2 回目の同テーマ session で自動生成（手動作成も可）
- 後方互換: なくても skill は動く

### テーマ status
```
not_started → explored → spec_ready → implemented
```

### TreeView（CLI テキスト）
```
## プロジェクト: API サービス化

├── ✅ 推奨アルゴリズム（3 sessions, Gap: C0/H3/M2/L2）
│   └── Spec 化: 未実施
├── ⬜ server と kit の連携
└── ⬜ カスタムキャラの共有

テーマを選んでください:
1. ✅ 推奨アルゴリズム → 深掘り or Spec 化
2. ⬜ server と kit の連携 → 新規 DGE
3. ⬜ カスタムキャラの共有 → 新規 DGE
4. 新しいテーマを追加
```

### プロジェクトファイルフォーマット
```markdown
---
project: API サービス化
created: 2026-03-30
status: in_progress
---

## テーマ

### 推奨アルゴリズム
- status: explored (3 sessions)
- sessions:
  - dge/sessions/api-service-design.md
  - dge/sessions/recommend-algorithm-design.md
  - dge/sessions/recommend-algorithm-deepdive.md
- gaps: 14 (Critical: 1, High: 6, Medium: 5, Low: 2)
- spec_status: pending

### server と kit の連携
- status: not_started

### カスタムキャラの共有
- status: not_started
```

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 92 | TreeView: 動的生成 vs 永続ファイル → 永続ファイル | Missing logic | **High** |
| 93 | プロジェクトファイルの概念がない | Missing logic | **Critical** |
| 94 | テーマ同一性判定 → ユーザー確認式 | Safety gap | Medium |
| 95 | プロジェクト名 vs テーマ名の区別 | Spec-impl mismatch | **High** |
| 96 | DGE 中の新テーマ自動追加 | Missing logic | Medium |
| 97 | プロジェクトファイル自動更新タイミング | Missing logic | **High** |
| 98 | 同時更新競合（v1 無視、v2 ロック） | Safety gap | Low |

---

## MVP 成果物

| # | 成果物 |
|---|--------|
| 1 | `dge/projects/` ディレクトリ |
| 2 | プロジェクトファイルフォーマット定義 |
| 3 | skill Step 9B にプロジェクト tree 表示追加 |
| 4 | session 保存時のプロジェクトファイル自動更新 |
| 5 | install.sh に `dge/projects/` 作成追加 |

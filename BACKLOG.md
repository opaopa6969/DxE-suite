# DGE-toolkit バックログ

> 最終更新: 2026-03-29
> 前回セッション: Meta DGE（DGE自身をDGEで検証・改善）

## 完了済み

### Meta DGE セッション（3本）
- `sessions/meta/001-methodology-validation.md` — 方法論の根本検証（今泉,ヤン,ハウス）18 gaps
- `sessions/meta/002-adoption-ux.md` — 採用・UXの検証（利根川,僕,千石）24 gaps
- `sessions/meta/003-limits-and-risks.md` — 限界と法的リスク（Red Team,ソウル,鷲津）29 gaps
- `sessions/meta/summary.md` — 横断まとめ（71 gaps）

### Critical 7件 → 全件対応済み
| 成果物 | 対応した Gap |
|--------|-------------|
| `paper/experiment-design.md` | 比較実験デザイン（単純プロンプト vs DGE） |
| `personas.md` | 4ペルソナ定義 |
| `quality-criteria.md` | 出力品質基準 + アンチパターン |
| `characters/atlas.md`（修正） | Disney/Marvel キャラ → 安全な代替に差し替え |
| `strategy.md` | プラットフォームリスク + Gap-問題相関フレームワーク |

### High 16件（未着手分）→ 全件対応済み
| 成果物 | 対応した Gap |
|--------|-------------|
| `DISCLAIMER.md` | 免責事項（coverage非保証、専門判断の代替ではない、IP注意） |
| `method.md`（修正） | Prerequisites追加、3分版TL;DR、LLM非依存クイックスタート |
| `gap-definition.md` | Severity基準、粒度基準、偽陽性検証、優先度フレームワーク |
| `limitations.md` | LLM限界、合意バイアス対策、他手法比較、データセキュリティ |

## 残タスク

### 優先度: 高（実行系）
1. **比較実験の実行** — `paper/experiment-design.md` に従い 4条件×3ドキュメント×5回を実際に回す
2. **README リライト** — ペルソナ（`personas.md`）に基づき、ユーザーの課題から始まる README に書き換える
3. **retrospective analysis** — unlaxer 108 gaps / AskOS 16 gaps の outcome を `strategy.md` Part 2 のフレームワークで追跡

### 優先度: 中（Medium gaps 21件）
- summary.md のテーマ別集約で Medium のものが残っている
- 多くは Critical/High 対応の波及で部分解決済み
- 未確認: 実際にどれだけ残っているか棚卸しが必要

### 優先度: 低
- Low gaps 3件（キャラ使用頻度データ収集、テンプレート名改善、推奨組み合わせ理由記載）
- これらは実運用データが溜まってから対応すべき

### その他検討事項
- `dge-method/` ディレクトリは削除済み（全コンテンツは DGE-toolkit に含まれていた）
- テンプレート選択ディシジョンツリー（2-008）は未作成
- catalog.md の日本キャラの IP リスクは低リスクと判断し未修正

## ファイル構成（現在）

```
DGE-toolkit/
├── README.md              ← 要リライト
├── DISCLAIMER.md          ← NEW
├── BACKLOG.md             ← これ
├── method.md              ← UPDATED（TL;DR + Prerequisites + QS改善）
├── personas.md            ← NEW
├── quality-criteria.md    ← NEW
├── gap-definition.md      ← NEW
├── limitations.md         ← NEW
├── strategy.md            ← NEW
├── characters/
│   ├── catalog.md
│   ├── custom-guide.md
│   └── atlas.md           ← UPDATED（IP対応）
├── templates/
│   ├── api-design.md
│   ├── feature-planning.md
│   ├── go-nogo.md
│   ├── incident-review.md
│   └── security-review.md
├── skills/
│   ├── dge-session.md
│   └── dge-template-create.md
├── examples/
│   └── askos-adversarial.md
├── paper/
│   ├── experiment-design.md  ← NEW
│   ├── v1/ v2/ v3/          ← 論文バージョン
└── sessions/
    └── meta/
        ├── 001-methodology-validation.md
        ├── 002-adoption-ux.md
        ├── 003-limits-and-risks.md
        └── summary.md       ← UPDATED
```

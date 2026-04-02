# 参考: GitHub PR コメント取得の完全性

> **位置づけ**: PR レビュー対応フローを DRE に追加する際の参考資料。  
> 実際のインシデントから得た知見をルール化したもの。

---

## 背景

GitHub のプルリクエストには**3種類のコメント**が存在するが、それぞれ異なる API エンドポイントからしか取得できない。Coding Agent が 1〜2 種類しか叩かなかった場合、レビュー本文（`/reviews` のボディ）が丸ごと漏れる。

**発生したインシデント（vacant-allinone PR #35）**:  
PR レビューへの返答タスク中、`CHANGES_REQUESTED` 状態のレビュー本文（正規化仕様に関する質問）が未取得のまま「コメントなし」と判断された。結果として対応が後回しになり、ユーザーが URL を直接指摘して初めて発覚した。

---

## GitHub PR コメント 3種類

| 種別 | エンドポイント | 内容 | 漏れやすさ |
|------|--------------|------|----------|
| イシューコメント | `GET /repos/{owner}/{repo}/issues/{pr}/comments` | PR 全体への通常コメント | 低 |
| レビューコメント（行コメント） | `GET /repos/{owner}/{repo}/pulls/{pr}/comments` | diff の特定行に紐づくコメント | 低 |
| **レビュー本文** | `GET /repos/{owner}/{repo}/pulls/{pr}/reviews` | CHANGES_REQUESTED / APPROVED 時のレビューサマリー本文 | **高** |

---

## PR コメント対応フローに組み込む際の想定ルール

### MUST: 3エンドポイントをすべて取得する

```bash
# 1. イシューコメント
gh api repos/{owner}/{repo}/issues/{pr}/comments

# 2. 行コメント
gh api repos/{owner}/{repo}/pulls/{pr}/comments

# 3. レビュー本文（見落としやすい）
gh api repos/{owner}/{repo}/pulls/{pr}/reviews
```

3つを取得してから「未返答コメントがあるか」を判断する。

### MUST: レビュー本文の `body` が空でなければ返答対象

`/reviews` のレスポンスで `body` が非空のエントリは返答対象。  
`state` が何であっても（`CHANGES_REQUESTED` / `APPROVED` / `COMMENTED`）`body` があれば返答が必要。

### 参考: 確認コマンド

```bash
# レビュー本文を一覧表示
gh api repos/{owner}/{repo}/pulls/{pr}/reviews \
  | python3 -c "
import json, sys
for r in json.load(sys.stdin):
    if r['body']:
        print(r['state'], '|', r['submitted_at'][:10], '|', r['body'][:100])
"
```

---

## state の意味

| state | 意味 | 対応要否 |
|-------|------|---------|
| `CHANGES_REQUESTED` | 修正要求あり | body があれば必須 |
| `APPROVED` | 承認 | body があれば要確認 |
| `COMMENTED` | コメントのみ | body があれば要確認 |
| `PENDING` | 下書き（未送信） | 不要 |

---

## 判定フロー（将来のフロー定義用）

```
PR のコメント対応を開始する
  │
  ├─ /issues/{pr}/comments      → イシューコメント一覧を取得
  ├─ /pulls/{pr}/comments       → 行コメント一覧を取得
  └─ /pulls/{pr}/reviews        → レビュー一覧を取得
       │
       ├─ body が非空のレビューがある → 返答対象リストに追加
       └─ body が空 → スキップ
  │
  すべて収集してから返答処理を開始する
```

---

## 補足

- `gh pr view` はこの3種を統合して表示しない。`gh api` で個別取得が必要。
- 行コメントで `position: null` のものは outdated（古いコミットへのコメント）。GitHub UI では折りたたまれるが API では残っている。

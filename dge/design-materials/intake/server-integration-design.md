# dge-server 統合設計

## 現状

dge-session スキルは dge-server を一切使っていない。

| 機能 | スキルの現行動作 | サーバーの対応API |
|---|---|---|
| キャラ一覧 | `dge/characters/index.md` を直接読む | `GET /api/characters` |
| キャラ推奨 | スキル内ロジックで判断 | `POST /api/characters/recommend` |
| セッション保存 | `dge/sessions/` にファイル書き込み | `POST /api/sessions` |
| カスタムキャラ | `dge/custom/characters/*.md` を読む | `POST /api/characters` |

## 方針：サーバーはオプション扱い

サーバーが起動していれば使う。なければファイルベースで動く（現行の動作を維持）。

```
dge-session スキル
  → サーバー起動確認 (GET /api/health)
      ├─ 200 OK  → サーバーモード（API を使う）
      └─ 失敗    → ファイルモード（現行の動作）
```

## 各ステップの変更案

### Step 1: キャラ一覧読み込み

```
ファイルモード（現行）:
  dge/characters/index.md を読む

サーバーモード:
  GET /api/characters
  → built-in + カスタムキャラを一覧取得
  → ファイルを読まずに済む
```

### Step 4: キャラ推奨

```
ファイルモード（現行）:
  スキル内の固定ロジックで判断
  （固定枠: ヤン + 今泉、可変枠: テーマから推定）

サーバーモード:
  POST /api/characters/recommend
  { "agenda": "<テーマ>", "template": "<テンプレ名>", "max": 4 }
  → キーワードベースの推奨結果を取得
  → スキル内ロジックの代わりにサーバーの推奨を使う
```

### Step 7: セッション保存

```
ファイルモード（現行）:
  dge/sessions/<date>-<theme>.md に書き込む

サーバーモード（追加）:
  ファイル保存は引き続き行う（正典はファイル）
  + POST /api/sessions でDBにも記録
  { "theme": "...", "template": "...", "characters": "...",
    "gap_count": N, "gap_critical": N, ..., "file_path": "..." }
  → セッション履歴の集計・検索が可能になる
```

## dge-tool への組み込み

サーバーの起動確認と API 呼び出しは `dge-tool` を経由する。
スキルから直接 fetch するのではなく、CLI ラッパーに閉じ込める。

```
node dge/bin/dge-tool.js server:check
  → 0: 起動中, 1: 停止中

node dge/bin/dge-tool.js server:recommend --agenda "認証API設計" --template api-design
  → JSON で推奨キャラセットを返す

node dge/bin/dge-tool.js session:save --theme "..." --gaps 12 --file "..."
  → サーバーモードなら API 送信、ファイルモードならスキップ
```

## スキルの変更箇所

`Step 1` に以下を追加：

```
dge-tool server:check でサーバー起動確認。
成功 → サーバーモードフラグ ON（以降の Step で API を使う）
失敗 → ファイルモードで続行（現行と同じ）
```

## メリット

- **後方互換** — サーバーなしでも動く。既存ユーザーへの影響ゼロ
- **段階的に移行できる** — 各 Step を順番に対応すればいい
- **セッション集計** — DB があることでプロジェクト横断の gap 傾向分析が将来できる

## 優先度

1. `server:check` の実装（dge-tool）
2. `session:save` の実装（セッション記録は副作用が小さい）
3. `server:recommend` の実装（推奨ロジックの移譲）
4. `GET /api/characters` でキャラ一覧取得（カスタムキャラ管理の強化）

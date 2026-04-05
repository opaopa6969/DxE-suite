# BACKLOG — DRE-toolkit

> 最終更新: 2026-04-04
> バージョン: v0.5.0

## 完了済み

- ✅ install.sh 実装（`.claude/` へのコピー）
- ✅ update.sh 実装（カスタマイズ保護、新規ファイルのみ追加）
- ✅ .dre-manifest 生成（ファイル一覧 + sha256）
- ✅ dre-reset.md — ファイル単位リセット（CUSTOMIZED → INSTALLED）
- ✅ dre-uninstall.md — アンインストール（any → FRESH）
- ✅ dxe-command.md — dxe update/install/status をそのまま実行
- ✅ dre-activate.md — スキル有効化・無効化（skills/disabled/ 方式）
- ✅ rules/dre-skill-control.md — disabled/ スキル無視ルール
- ✅ update.sh: disabled/ のファイルも更新
- ✅ トリガー競合解消（dre-update.md を dxe-command.md に統合）

---

## P0: すぐやる

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 1 | **dre-session.md 作成** — 「DRE して」の挙動定義。.claude/ 現状診断 → 番号付きアクション提案 | DGE session 2026-04-04 | 実装 |
| 2 | **Layer 3: dxe update 時に CLAUDE.md のスキル索引を自動再生成** — 手動索引は腐るため | DGE session skills過多 | 設計+実装 |

## P1: 設計が要る

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 3 | **ユースケース定義** — プロファイル設計の前提。A:チーム設定統一 B:DxE管理 C:自作rules配布 | DGE Gap #4 | 設計 |
| 4 | **extends 的な継承機構** — 親パッケージの設定を extends して差分だけ上書き | BACKLOG旧 | 設計+実装 |
| 5 | **kit/bin/dre-tool.js の実装** — status / list / activate / deactivate を CLI で | BACKLOG旧 | 実装 |

## P2: 将来

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 6 | **cross-tool 変換** — `dre-tool export --cursor / --codex / --gemini` | BACKLOG旧 | 設計+実装 |
| 7 | **スキルカタログ** — `kit/skills/catalog.md`（awesome のインデックスを内側に持つ） | BACKLOG旧 | コンテンツ |
| 8 | **npm keyword `claude-config` での publishing** | BACKLOG旧 | マーケティング |

## Inbox（未分類）

- [ ] PR レビュー対応フロー — `/pulls/{pr}/reviews`（レビュー本文）を含む3エンドポイント取得をルール化する

### BACKLOG-FORMAT: Readiness / Depends / Spec 情報の追加

**Added:** 2026-04-05
**出典:** volta-platform AUTH 系 backlog の実装可否判定作業
**種類:** 設計 (DGE) → 実装 (DRE)

**Problem:**
現在の `backlog-management.md` フォーマットは `Status | Design | Depends on` の3列。
実プロジェクト（volta-platform��で AUTH 系 9 件を一括着手しようとした際、以下が分からなかった:

1. **Readiness** — DB/API/UI どこまで実装済みか、spec があるか（🟢 ready / 🟡 needs-work / 🔴 blocked）
2. **Repo** — マルチリポジトリ構成でどのリ���ジトリが対象か
3. **DGE session** — 設計済みかどうか、どの DGE session が対応するか
4. **依存関係の詳細** — 「AUTH-005 は AUTH-003 と AUTH-006 に blocked」のような依存グラフ

結果、全件の readiness を手動で調査する必要があった（DGE session 読み、コード探索、DB スキーマ確認）。

**Goal:**
- `backlog-management.md` のアイテムフォーマットを拡張して readiness が一目で分かるようにする
- DGE session が backlog アイテムを生成/更新する際の出力フォーマットも連動させる
- DRE の backlog ↔ DGE の session output のデータフローを定義する

**DGE に投げるべき設計質問:**
- Readiness の粒度（2段階 vs 3段階 vs マトリクス）
- マルチリポジトリ構成での Repo フィールドの持ち方
- DGE session → backlog item 生成の自動化フロー
- 既存フォーマットとの後方互換

**期待するフロー:**
1. DRE が DGE に「backlog フォーマット拡張」の設計セッションを依頼
2. DGE がキャラクター劇で設計の穴を探る
3. DGE output → spec
4. DRE が spec を元に `backlog-management.md` と DGE 出力テンプレートを更新

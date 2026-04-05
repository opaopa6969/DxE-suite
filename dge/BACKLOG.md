# DGE-toolkit バックログ

> 最終更新: 2026-04-05
> バージョン: v4.0.0 (DxE-suite monorepo)
> 前回セッション: DVE設計 (7 rounds, 29 gaps)

## v3.0-3.2 で完了したもの

### v3.0.0（メジャーアップデート）
- ✅ 全 19 キャラに評価軸（axis）追加（ja/en）
- ✅ Phase 0: プロジェクトコンテキスト自動収集
- ✅ 応答義務（賛成/反対/保留の表明必須）
- ✅ 6 セッション構造（座談会, 査読劇, 兵棋演習, VC ピッチ, 症例検討, 事故調査）
- ✅ 構造の自動選択（テーマキーワードから）
- ✅ 英語版 i18n 完全対応（--lang en）
- ✅ install.sh / update.sh の --lang 対応
- ✅ 英語版キャラ 19 体、テンプレート 5 種、スキル 3 種
- ✅ 初回オンボーディングメッセージ

### v3.1.0（volta フィードバック反映）
- ✅ Gap ライフサイクル管理（Active/Void/Archived）— skill 記載
- ✅ 実装レディネスチェックリスト — skill 記載
- ✅ 固定枠+可変枠キャラ構造 — skill 記載
- ✅ 専門家キャラ自動提案 — skill 記載
- ✅ 不足領域の警告 — skill 記載
- ✅ セッション終了時のフィードバック収集 — skill 記載
- ✅ 新パターン 3 件（delegation-matrix, phase-minimization, protocol-design）
- ✅ protocol-design テンプレート
- ✅ フィードバックテンプレート
- ✅ DGE/LLM 補完関係の明文化（method.md）

### v3.2.0（マルチツール対応）
- ✅ AGENTS.md（Codex）対応
- ✅ GEMINI.md（Gemini CLI）対応
- ✅ .cursorrules（Cursor）対応
- ✅ 全ドキュメント更新（README ja/en, INTERNALS ja/en, dev.to, Zenn）

### 以前の完了分
- ✅ Meta DGE 3 セッション（71 gaps）
- ✅ Critical 7 件 + High 16 件 全件対応
- ✅ DISCLAIMER.md, personas.md, quality-criteria.md, gap-definition.md, limitations.md, strategy.md

---

## 残タスク

### v3.4.x で完了したもの

- ✅ 劇的表現・沈黙ルール追加（dge-session.md Step 5）
- ✅ 🧩 マンガー（Domain Shifter）キャラ追加
- ✅ 🎬 舞台監督（Meta Observer）キャラ追加
- ✅ 🔭 opa（Altitude Shifter）キャラ追加
- ✅ DGEセッション選択肢ループ（Step 9 完了後に Step 8 に戻る）
- ✅ version.txt と package.json の同期修正

### P0: すぐやる（次の作業セッション）

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 23 | **キャラのブレ防止** — axis（評価軸）に沿わない発言をしていないか判定する仕組み | 会話 | スキル改善 |
| 1 | **サンプル設計ドキュメント追加** — `dge/samples/auth-api.md` を install 時に配置 | UX DGE #5 | 実装 |
| 2 | **30 秒エレベーターピッチ作成** — README, dev.to, Zenn の冒頭に | 査読劇 #10 | コンテンツ |
| 3 | **ターゲットペルソナ更新** — personas.md を v3 に合わせて更新 | 査読劇 #8 | コンテンツ |

### P0.5: UX細部

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 20 | **テーマなし DGE 起動時の選択肢を番号付きにする** — 「1. dge-server統合 2. DRE設計...」のように番号を付け、ユーザーが数字1つで選べるようにする | 会話 | UX |
| 21 | **post_actions に「保存して終わる（コメント付き）」を追加** — 実装せずにギャップだけ記録したいケースに対応。選択時にユーザーコメントを求めてセッションファイルに付記する | 会話 | UX | — 「1. dge-server統合 2. DRE設計...」のように番号を付け、ユーザーが数字1つで選べるようにする | 会話 | UX |

### P1: 設計が要る（v3.3 候補）

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 5 | **Phase 0 強化 — ドキュメントなしでもリッチコンテキスト生成** — README + コード構造から設計を推測する能力 | 査読劇 #9 | 設計+実装 |
| 6 | **Gap ライフサイクルの dge-tool 実装** — Active/Void/Archived の状態管理を CLI で。skill 記載は済み | volta FB #3 | 実装 |
| 7 | **実装レディネスの dge-tool 実装** — チェックリスト判定を CLI で。skill 記載は済み | volta FB #4 | 実装 |
| 8 | **install.sh / update.sh のテスト** — エッジケース（既存ファイルあり、--lang 切替、.lang 消失等） | 査読劇 #6 | テスト |
| 9 | **limitations.md 更新** — v3 の新機能に合わせて LLM 依存、ドメイン限界、偽陰性の限界を明示 | 査読劇 #2 | コンテンツ |

### P2: 中期（v4 候補）

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 10 | **MCP サーバー化** — Claude Code / Codex / Cursor 等から統一的に使える本命の解 | 査読劇 #5 | 設計+実装 |
| 11 | **マルチフェーズ原理の formalize** — Phase 1/2/3 の共通原理をメソッド文書として記述 | キャラ DGE #22 | コンテンツ |
| 12 | **偽陰性率ベンチマーク** — 既知 Gap を含む設計に DGE を適用し発見率を測定 | 査読劇 #1 | 実験 |
| 13 | **比較実験の実行** — experiment-design.md に従い 4 条件 × 3 ドキュメント × 5 回 | BACKLOG 既存 | 実験 |
| 14 | **retrospective analysis** — unlaxer 108 gaps / AskOS 16 gaps の outcome 追跡 | BACKLOG 既存 | 分析 |

### P3: 長期 / マーケティング

| # | タスク | 出典 | 種類 |
|---|--------|------|------|
| 15 | **マーケティング戦略** — 最初の 100 ユーザー獲得計画 | 査読劇 #11 | 戦略 |
| 16 | **v2→v3 ケーススタディ記事** — 「DGE で DGE を改善した」Zenn / dev.to 記事 | 会話 | コンテンツ |
| 17 | **volta ケーススタディ記事** — 106 Gap の実例 | 会話 | コンテンツ |
| 18 | **動画の v3.2 対応** — デモ動画を最新に更新、YouTube 再アップ | 会話 | コンテンツ |
| 19 | **Zenn 記事公開** — v3 対応版で公開 | 会話 | マーケティング |

### P4: DGE プロセス改善

- ✅ **会話劇 → 設計判断リンク** — `record_decision` post_action + DDテンプレート + 相互リンク自動化。全8 flow YAML、dge-session.md Step 9.5、dge-update.md、method.md、kit/templates/decision.md を更新。DGEセッション: `dge/sessions/2026-04-05-dd-crosslink-design.md`

### 解決済みだが要確認

- Medium gaps 21 件（旧 BACKLOG）— 多くは v3 対応の波及で解決済みの可能性。棚卸し必要
- Low gaps 3 件 — 実運用データが溜まってから
- テンプレート選択ディシジョンツリー（2-008）— 構造の自動選択で部分解決
- catalog.md の日本キャラ IP リスク — 低リスク判断維持

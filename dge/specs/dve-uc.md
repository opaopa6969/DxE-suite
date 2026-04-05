# UC Spec: DVE Use Cases

- **Status**: draft
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Resolves**: Gap #3, #5, #7, #12, #17, #20, #25, #28, #29

---

## UC-1: 決定の経緯を辿る (read)

**アクター**: 開発者（プロジェクト参加者、新メンバー含む）
**トリガー**: 「この機能なぜこの仕様？」

### フロー

1. ユーザーが `npx dve serve` でブラウザを開く
2. L1 DecisionMap が表示される
   - DD ノードが時系列で並ぶ（dagre layout, left-to-right）
   - DD ノードのサイズは関連 Gap 数に比例
   - Gap / Session はデフォルト折りたたみ
   - overturn/drift の DD は色・枠で区別
3. DD ノードをクリック → L2 GapDetail パネルが右に開く
   - DD のタイトル、日付、Rationale
   - 関連 Gap のリスト（severity 色つき）
   - Annotation があれば表示（action 優先順）
   - supersedes チェーン表示
4. Gap をクリック → L3 DialogueView が展開
   - 該当 Gap の `line_ref` を中心にハイライト表示
   - 前後 10 行のコンテキスト
   - キャラ名に色分け + アイコン表示
   - 「Show full session」で全文展開

### CLI 代替

```bash
npx dve trace DD-005
# Output:
#   DD-005: JWT 採用 (2026-04-01)
#     ← G-002: セッション無効化 (Critical)
#     ← G-001: トークンリフレッシュ未定義 (High)
#     ← Session: 2026-04-01-auth (今泉, 千石, Red Team)
#   Superseded by: DD-012
```

---

## UC-2: 過去の会話にコメントを付ける (annotate)

**アクター**: 開発者
**トリガー**: session を読んでいて意見がある

### フロー

1. L3 DialogueView で会話を読んでいる
2. 特定の箇所で「コメント」ボタンを押す
3. コメント入力（body + action 選択）
4. **Phase 1**: 入力内容がクリップボードにコピーされる + ファイルパスが表示される
   - ユーザーが `dve/annotations/` に手動保存、または CLI で作成
5. **Phase 2**: Web UI から直接ファイル保存

### CLI 代替

```bash
npx dve annotate DD-005 --action drift --body "JWT→session-based に変更済み"
# → dve/annotations/a-001-dd005-drift.md を生成
```

---

## UC-3: 会話の特定ポイントからやり直す (fork)

**アクター**: 開発者
**トリガー**: 「この Gap の議論、前提が変わった」

### フロー

1. L2/L3 で Gap を選択
2. 「ここから DGE」ボタン
3. DVE が ContextBundle を生成:
   - origin: 選択した Gap
   - summary: 元 session のサマリー
   - prompt_template: 自動生成テキスト
4. prompt_template がクリップボードにコピー
5. ユーザーが Claude Code に貼って DGE 開始

### 生成されるプロンプト例

```
前回のDGEセッション「認証API設計」(2026-04-01) の Gap #2 を深掘り。
Gap: セッション無効化が未定義。
前回の決定: DD-005 (JWT採用)。
前回のキャラ: 今泉, 千石, Red Team。
この Gap を中心に DGE して。
```

---

## UC-4: 追加制約で深掘り (constrained re-run)

**アクター**: 開発者
**トリガー**: 「前回の話 + この制約を追加して DGE」

### フロー

1. DD または Gap を選択
2. 「制約を追加して DGE」ボタン
3. 制約テキストを入力（例: 「セッション無効化が必要になった」）
4. DVE が ContextBundle を生成（constraints に追加）
5. prompt_template にクリップボードコピー → DGE 起動

---

## UC-5: どんでん返し (overturn)

**アクター**: 開発者
**トリガー**: 「この決定は撤回する」

### フロー

1. DD ノードを選択
2. 「この決定を撤回する」ボタン
3. DVE が影響範囲を算出（impactOf()）
   - 影響を受ける Spec, 実装ファイル等をハイライト
4. 確認画面: 「DD-005 を撤回します。影響範囲: Spec-003, auth.ts」
5. Annotation(action: overturn) を生成
6. DD の表示が overturned スタイルに変更（赤枠・取り消し線）
7. 「新しい決定を DGE で検討」→ UC-4 のフローへ

---

## UC-6: コンテキスト復元 (context reconstruction)

**アクター**: 開発者
**トリガー**: 過去の session のコンテキストが LLM のウィンドウにない

### フロー

1. DVE が ContextBundle を自動生成
2. Session サマリー + Gap リスト + DD リスト + Annotation を含む
3. prompt_template として機械的にテキスト化（LLM 不要）
4. ユーザーが DGE にテキストを渡す → DGE Phase 0 がコンテキストとして認識

---

## 画面仕様

### L1: DecisionMap

```
┌─────────────────────────────────────────┐
│ DVE — Decision Map           [Search 🔍]│
│                                          │
│  ┌───┐    ┌─────┐    ┌───┐    ┌───────┐ │
│  │DD1│───→│DD-05│───→│DD8│    │DD-012 │ │
│  └───┘    └─────┘    └───┘    └───────┘ │
│  (small)  (large)   (small)  (overturn) │
│            ↑ click                       │
│  ─────────────────────────────── 時間軸→ │
│  NEW: DD-012, Session-045               │
└─────────────────────────────────────────┘
```

- DD ノードサイズ: 関連 Gap 数に比例
- supersedes エッジ: 矢印で接続
- ノードスタイル: active(白), overturned(赤), drifted(黄・点線)
- 新規ノード: "NEW" バッジ（changelog.json ベース）
- Layout: dagre (left-to-right, 時間軸)

### L2: GapDetail (右パネル)

```
┌──────────────────────┐
│ DD-005: JWT 採用       │
│ 2026-04-01 | active   │
│                       │
│ Rationale:            │
│ ステートレス認証を...  │
│                       │
│ Gaps (3):             │
│  🔴 G-001 トークン... │
│  🔴 G-002 セッション..│
│  🟡 G-003 レート制限..│
│                       │
│ Annotations:          │
│  ⚠ drift: JWT→session │
│  💬 comment: ...      │
│                       │
│ [🔄 DGEで再検討]      │
│ [❌ この決定を撤回]    │
│ [💬 コメント追加]      │
└──────────────────────┘
```

### L3: DialogueView (展開)

```
┌──────────────────────────────────────┐
│ Session: 2026-04-01-auth             │
│ Characters: 今泉, 千石, Red Team     │
│                                      │
│  ...                                 │
│  👤 今泉: そもそも聞いていいですか。   │
│  JWTって本当にステートレスで...        │
│                                      │
│  → Gap 発見: セッション無効化が      │  ← ハイライト
│    未定義。JWT のステートレス前提と    │
│    矛盾する可能性。                   │
│                                      │
│  🎩 千石: これは品質の問題です。      │
│  ...                                 │
│                                      │
│  [Show full session]                 │
└──────────────────────────────────────┘
```

---

## CLI コマンド一覧

| コマンド | 説明 | Phase |
|----------|------|-------|
| `npx dve build` | graph.json + static site 生成 | 1 |
| `npx dve serve` | dev server 起動 | 1 |
| `npx dve serve --watch` | ファイル監視 + 自動リビルド | 1 |
| `npx dve trace <DD-id>` | 因果チェーンをテキスト出力 | 1 |
| `npx dve search <keyword>` | graph.json 内テキスト検索 | 1 |
| `npx dve annotate <id> --action <type>` | Annotation 作成 | 1 |
| `npx dve orphans` | 未解決 Gap 一覧 | 1 |
| `npx dve impact <id>` | 影響範囲表示 | 2 |

# AskOS UI — DGE Dashboard Spec

## 概要

DGEワークフローの会話劇・成果物・履歴を閲覧・管理するAskOS UIの画面仕様。

---

## 1. 画面一覧

```
AskOS UI
├── Overview (既存)
│   └── DGE Summary Widget (NEW)
│
├── Projects (既存)
│   └── Project Detail
│       └── DGE Tab (NEW)
│           ├── DGE Runs (実行履歴)
│           ├── DGE Run Detail
│           │   ├── Dialogue Viewer (会話劇閲覧)
│           │   ├── Gap Analysis (gap分析)
│           │   ├── Spec Artifacts (成果物)
│           │   └── Convergence Chart (収束グラフ)
│           └── Pattern Selector (パターン選択)
│
├── Workflows (既存/拡張)
│   └── DGE Workflow instances
│
└── DGE Library (NEW)
    ├── Pattern Catalog (パターンカタログ)
    ├── Template Gallery (テンプレートギャラリー)
    └── Cross-Project Insights (横断分析)
```

---

## 2. Project Detail → DGE Tab

### 2.1 DGE Runs（実行履歴）

```
┌──────────────────────────────────────────────────────────┐
│  DGE Runs                                      [Run DGE] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  auth-flow                          3 days ago     │  │
│  │  Status: ✅ completed                              │  │
│  │  Iterations: 2  │  UCs: 15  │  Gaps: 10           │  │
│  │  Patterns: zero-state, role-contrast               │  │
│  │  Convergence: 0.22 (converged)                     │  │
│  │                                    [View] [Re-run] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  notification                       1 week ago     │  │
│  │  Status: ⏸ waiting (approve-spec)                  │  │
│  │  Iterations: 1  │  UCs: 8   │  Gaps: 6            │  │
│  │  Patterns: escalation-chain                        │  │
│  │  Convergence: 0.75 (diverging)                     │  │
│  │                                    [View] [Resume] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  cart-checkout                      2 weeks ago    │  │
│  │  Status: ⚠️ drift detected                         │  │
│  │  Iterations: 3  │  UCs: 22  │  Gaps: 14           │  │
│  │  Drift: 4 files changed since DGE                  │  │
│  │                              [View] [Re-run Diff]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 DGE Run Detail

タブ構成で会話劇 / Gap分析 / 成果物 / 収束を切り替える。

```
┌──────────────────────────────────────────────────────────┐
│  ← Back    auth-flow DGE Run #1          3 days ago      │
├──────────────────────────────────────────────────────────┤
│  [Dialogue]  [Gaps]  [Artifacts]  [Convergence]          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  (Tab content area — see sections below)                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Dialogue Viewer（会話劇閲覧画面）

### 3.1 メインビュー

会話劇をチャット風UIで表示。gapが発見されたターンをハイライト。

```
┌──────────────────────────────────────────────────────────┐
│  Dialogue v2                     Iteration: 2 of 2       │
│  Patterns: zero-state, role-contrast                     │
│  Validation: ✅ clean (0 hallucinations)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 👤 田中（初回ユーザー）                Turn 1     │    │
│  │ このダッシュボード、データのエクスポートできる？   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 🖥 System                             Turn 2     │    │
│  │ エクスポートボタンは右上です。CSV形式で出力可能。  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 👤 田中                               Turn 3     │    │
│  │ PDFでほしいんだけど……フィルタかけた状態で出せる？  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐     │
│  │ 🔇 System（沈黙）                     Turn 4   │     │
│  │ ── この機能は未実装 ──                          │     │
│  │                                                 │     │
│  │ ⚠️ GAP: PDFエクスポート           [Critical]   │     │
│  │ ⚠️ GAP: フィルター付きエクスポート [Major]      │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ... (scroll)                                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Gaps Found: 10 (3 critical, 4 major, 3 minor)           │
│  Persona Coverage: 田中 5/5, 管理者鈴木 4/4, API連携 3/3 │
│                                                          │
│  Version: [v1] [▸v2]                                     │
│  Hallucination Report: [View]                            │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Gap サイドパネル

会話劇の右側にgap一覧パネルを表示。gapをクリックすると対応するターンにスクロール。

```
┌───────────────────────────┐
│  Gaps (10)          [Filter] │
├───────────────────────────┤
│                           │
│  🔴 CRITICAL (3)          │
│  ├─ PDFエクスポート    T4  │
│  ├─ 二重決済防止       T12 │
│  └─ ロールバック       T18 │
│                           │
│  🟡 MAJOR (4)             │
│  ├─ フィルタ付きexport T4  │
│  ├─ 在庫切れ部分決済   T8  │
│  ├─ プログレス表示     T13 │
│  └─ エラーメッセージ   T16 │
│                           │
│  🔵 MINOR (3)             │
│  ├─ ヘルスチェック     T20 │
│  ├─ キーボードショート T22 │
│  └─ ダークモード       T25 │
│                           │
└───────────────────────────┘
```

---

## 4. Gap Analysis（Gap分析画面）

spec-gap-from-stories.md の内容を構造化表示。

```
┌──────────────────────────────────────────────────────────┐
│  Gap Analysis: auth-flow                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Data Model Changes (3)                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │ + users.password_reset_token    TEXT, nullable      │  │
│  │ + users.password_reset_expires  TEXT, nullable      │  │
│  │ + NEW TABLE: login_attempts     (rate limiting)     │  │
│  │                                      [View SQL]     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  🏗 Architecture Changes (2)                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Auth module                                        │  │
│  │ Current:  Session-based login only                 │  │
│  │ Discovered: Session + OAuth2 PKCE + Password Reset │  │
│  │ Implications:                                      │  │
│  │  • Token storage strategy needed                   │  │
│  │  • Email service integration                       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  🆕 New Features (4)                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Password Reset       ███░░  Hard    Source: T4     │  │
│  │ OAuth2 PKCE          ████░  Complex Source: T8     │  │
│  │ Rate Limiting        ██░░░  Moderate Source: T12   │  │
│  │ Session Management   ██░░░  Moderate Source: T16   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  📋 Implementation Priority                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Tier 1 (now):   Rate limiting, Session mgmt        │  │
│  │ Tier 2 (next):  Password reset, Error messages     │  │
│  │ Tier 3 (later): OAuth2 PKCE                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Artifacts（成果物画面）

生成されたドキュメント群をプレビュー・ダウンロード。

```
┌──────────────────────────────────────────────────────────┐
│  Artifacts: auth-flow                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 📄       │  │ 📄       │  │ 📄       │  │ 📄      │ │
│  │use-cases │  │spec-impl │  │gap-      │  │handover │ │
│  │.md       │  │ications │  │analysis  │  │.md      │ │
│  │          │  │.md       │  │.md       │  │         │ │
│  │ 15 UCs   │  │ 12 SIs   │  │ 10 gaps  │  │ Ready   │ │
│  │[View]    │  │[View]    │  │[View]    │  │[View]   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  Merge Status:                                           │
│  ├─ askos-stories/99-reference/use-cases.md  ⬜ pending  │
│  ├─ docs/spec-gap-from-stories.md            ⬜ pending  │
│  ├─ docs/data-model.md                       ⬜ pending  │
│  └─ handover/handover-to-claude-code.md      ⬜ pending  │
│                                                          │
│  [Merge All to Docs] [Download ZIP] [Send to Claude Code]│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Convergence Chart（収束グラフ）

DGEイテレーション間のgap数推移を可視化。

```
┌──────────────────────────────────────────────────────────┐
│  Convergence: auth-flow                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Gaps                                                    │
│  12 │ ████████████                                       │
│  10 │ ██████████                                         │
│   8 │ ████████    ████████                               │
│   6 │                                                    │
│   4 │                      ████                          │
│   2 │                                                    │
│   0 └─────────────────────────────────                   │
│       Iter 1      Iter 2      Iter 3                     │
│                                                          │
│  New Gap Rate:                                           │
│  Iter 1: 100% (all new)                                  │
│  Iter 2:  50% ████████████████████░░░░░░░░░░░░░░░░░░░░  │
│  Iter 3:  22% ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                          │
│  ✅ Threshold: 30%    Status: CONVERGED at Iter 3        │
│                                                          │
│  Contradiction Check:                                    │
│  ├─ Iter 1→2: 0 contradictions                           │
│  └─ Iter 2→3: 1 contradiction (auth model changed)       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Run DGE（実行画面）

新規DGE実行のセットアップ画面。

```
┌──────────────────────────────────────────────────────────┐
│  Run DGE: volta-platform                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Target Feature: [auth-flow                          ]   │
│                                                          │
│  App Type:       (●) Web  ( ) CLI  ( ) Library           │
│                  ( ) Infrastructure  ( ) API              │
│                                                          │
│  Audience:       (●) Engineer  ( ) Junior  ( ) PM        │
│                                                          │
│  Scope Path:     [src/auth/              ] (optional)    │
│                                                          │
│  Patterns:                                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Presets:                                           │  │
│  │ [New Project] [Feature Extension] [Pre-Release]    │  │
│  │                                                    │  │
│  │ Selected:                                          │  │
│  │ ☑ zero-state        ☑ role-contrast                │  │
│  │ ☑ escalation-chain  ☐ cross-persona-conflict       │  │
│  │ ☐ scale-break       ☐ security-adversary           │  │
│  │ ☐ migration-path    ☐ concurrent-operation         │  │
│  │ ... [Show All 20 Patterns]                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ☐ Skip verify-poc (I already know the codebase)         │
│                                                          │
│  Previous DGE: [None ▼]  (for diff mode)                 │
│                                                          │
│  [Start DGE] [Cancel]                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 8. DGE Library（横断画面）

全プロジェクト横断でDGE実行結果を閲覧。

```
┌──────────────────────────────────────────────────────────┐
│  DGE Library                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Summary                                              │
│  Total DGE Runs: 12   Total UCs Discovered: 187          │
│  Total Gaps: 94        Avg Convergence: 2.3 iterations   │
│                                                          │
│  📋 Recent Runs                                          │
│  ┌──────────┬──────────┬────┬─────┬──────────────────┐  │
│  │ Project  │ Feature  │UCs │Gaps │ Status           │  │
│  ├──────────┼──────────┼────┼─────┼──────────────────┤  │
│  │ volta    │ auth     │ 15 │ 10  │ ✅ converged     │  │
│  │ askos    │ workflow │ 22 │ 14  │ ✅ converged     │  │
│  │ unlaxer  │ parser   │  8 │  6  │ ⏸ reviewing     │  │
│  │ volta    │ notify   │  8 │  6  │ ⚠️ drift        │  │
│  └──────────┴──────────┴────┴─────┴──────────────────┘  │
│                                                          │
│  🔍 Pattern Effectiveness                                │
│  Most productive patterns:                               │
│  1. zero-state         → avg 4.2 gaps/run                │
│  2. escalation-chain   → avg 3.8 gaps/run                │
│  3. role-contrast      → avg 3.1 gaps/run                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. AskOS Question Integration

DGEのhuman_decisionステップがAskOS questionとして既存のQuestion UIに表示される場合の追加情報：

```
┌──────────────────────────────────────────────────────────┐
│  ❓ DGE会話劇レビュー: auth-flow                          │
│  Priority: Normal  │  Source: DGE Workflow  │  Step 3/7   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [View Full Dialogue] ← Dialogue Viewerに遷移           │
│                                                          │
│  Quick Summary:                                          │
│  • 28ターンの会話劇                                      │
│  • 10 gaps発見（3 critical）                              │
│  • Hallucination: 0件（clean）                            │
│  • 3ペルソナカバー                                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Critical Gaps:                                     │  │
│  │ 1. PDFエクスポート未実装 (Turn 4)                   │  │
│  │ 2. 二重決済防止なし (Turn 12)                       │  │
│  │ 3. ロールバック手段なし (Turn 18)                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [✅ Approve] [📝 Request More Scenarios] [❌ Reject]    │
│                                                          │
│  Feedback (for Request More):                            │
│  [                                                     ] │
│  [                                                     ] │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

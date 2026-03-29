# DGE Dialogue Pattern Taxonomy

## 概要

DGEの会話劇には再利用可能なパターンがある。パターンを明示的に選択することで、会話劇のバリエーションを制御し、発見の網羅性を高められる。

Workflow YAMLの `inputs.patterns` でカンマ区切りで指定する：
```yaml
inputs:
  patterns:
    type: string
    default: "zero-state,role-contrast"
    description: "適用する会話劇パターン（カンマ区切り）"
```

---

## Category A: 対比パターン（Comparison Patterns）

2つの状況を並べて差異から発見を得る。

### A1: Before/After（導入前後対比）

| Field | Value |
|-------|-------|
| ID | `before-after` |
| 目的 | 手法・機能の導入効果を実証する |
| 会話劇の構造 | 同じタスクを（1）導入前、（2）導入後で実行。所要時間・ステップ数・発見数を比較 |
| 発見できるもの | 導入の効果量、残存する手動ステップ、導入しても解決しない問題 |
| AskOS実績 | Story 1-2: specレビューとDGEの対比 |

### A2: Role Contrast（ロール対比）

| Field | Value |
|-------|-------|
| ID | `role-contrast` |
| 目的 | 異なるユーザーロールでのUX差異・権限問題を発見する |
| 会話劇の構造 | 同じ機能を2-3の異なるロール（シニア/ジュニア、管理者/エンドユーザー等）が使用 |
| 発見できるもの | 権限不足、過剰な権限、ロール別UXの欠如、ガイダンス不足 |
| AskOS実績 | Story 3-5: シニア/ジュニア/PMの対比 |

### A3: App-Type Variation（アプリ種別変奏）

| Field | Value |
|-------|-------|
| ID | `app-type-variation` |
| 目的 | 手法やパターンの汎用性を検証する |
| 会話劇の構造 | 同じ手法を異なるアプリ種別（Web/CLI/Library/Infrastructure）に適用 |
| 発見できるもの | 種別固有の制約、「会話」の再定義の必要性、テンプレート化の限界 |
| AskOS実績 | Story 6-9: ECサイト/Parser/Cloudflare/PoisonPills |

### A4: Expertise Level Contrast（習熟度対比）  ← NEW

| Field | Value |
|-------|-------|
| ID | `expertise-contrast` |
| 目的 | 初心者と熟練者で同じ操作の体験差を発見する |
| 会話劇の構造 | 同じタスクを（1）初回ユーザー、（2）毎日使うパワーユーザーが実行 |
| 発見できるもの | ショートカットの欠如、初期ガイダンスの不足、パワーユーザー向け最適化の余地 |
| 適用例 | AskOSのtask作成：初回ユーザーは会話で案内が必要、パワーユーザーはCLIで一発投入したい |

### A5: Platform Contrast（プラットフォーム対比）  ← NEW

| Field | Value |
|-------|-------|
| ID | `platform-contrast` |
| 目的 | デスクトップ/モバイル/API等、利用環境による差異を発見する |
| 会話劇の構造 | 同じ操作を（1）デスクトップブラウザ、（2）スマートフォン、（3）API経由で実行 |
| 発見できるもの | レスポンシブ対応の漏れ、タッチ操作の制約、API設計の不備 |
| 適用例 | AskOSのquestion承認：PCではreview画面で詳細確認、モバイルではSlack通知からワンタップ承認 |

---

## Category B: 探索パターン（Discovery Patterns）

特定の状況を設定して、通常のspec検討では見えない問題を炙り出す。

### B1: Zero-State（空状態起動）

| Field | Value |
|-------|-------|
| ID | `zero-state` |
| 目的 | 初期体験・オンボーディングフローの発見 |
| 会話劇の構造 | データ0、設定0の状態からシステムを起動する |
| 発見できるもの | 空状態UI、初期セットアップ手順、デフォルト値の妥当性、最初の成功体験までの距離 |
| AskOS実績 | Story 1 (first boot) → Entry pointがformではなくconversationと判明 |

### B2: Return After Absence（不在復帰）

| Field | Value |
|-------|-------|
| ID | `return-after-absence` |
| 目的 | 状態復帰・サマリー機能の発見 |
| 会話劇の構造 | 長期不在後にシステムに戻る。何が変わったか、何をすべきかを確認する |
| 発見できるもの | アクティビティサマリー、未処理キューの可視化、コンテキスト回復メカニズム |
| AskOS実績 | 九州ツーリング10日後の復帰シナリオ → morning summary機能の発見 |

### B3: Escalation Chain（エスカレーション連鎖）

| Field | Value |
|-------|-------|
| ID | `escalation-chain` |
| 目的 | エラーハンドリング・フォールバックパスの発見 |
| 会話劇の構造 | 小さな問題 → 対処失敗 → 上位に報告 → 上位でも対処失敗 → さらに上位…と段階的にエスカレート |
| 発見できるもの | エラー回復手順の欠如、エスカレーションパスの未定義、最終フォールバックの不在 |
| 適用例 | Agent回答 → Commander再判定 → 人間キュー → Slack通知 → 放置…のチェーン |

### B4: Cross-Persona Conflict（ペルソナ間衝突）

| Field | Value |
|-------|-------|
| ID | `cross-persona-conflict` |
| 目的 | 異なるペルソナの期待・優先度が衝突する場面の発見 |
| 会話劇の構造 | 2人のペルソナが同じリソースを異なる意図で操作し、衝突する |
| 発見できるもの | 排他制御の不備、優先度ルールの未定義、通知の欠如 |
| 適用例 | 開発者がhotfixしたい vs PMがリリースフリーズを宣言した |

### B5: Migration Path（移行パス）  ← NEW

| Field | Value |
|-------|-------|
| ID | `migration-path` |
| 目的 | 旧バージョンや旧システムからの移行パスの発見 |
| 会話劇の構造 | 旧システムのデータ/設定を持つユーザーが新システムに移行しようとする |
| 発見できるもの | データ変換の漏れ、互換性の問題、移行手順の不在、ロールバック手段 |
| 適用例 | Bitbucket → GitHub移行時の設定・Webhookの引き継ぎ |

### B6: Multi-Tenant Isolation（マルチテナント分離）  ← NEW

| Field | Value |
|-------|-------|
| ID | `multi-tenant` |
| 目的 | テナント間のデータ分離・権限分離の漏れを発見 |
| 会話劇の構造 | 2つの組織が同じシステムを使い、一方が他方のデータに触れようとする |
| 発見できるもの | データリーク、権限バイパス、テナント切り替えUI |
| 適用例 | AskOSのportfolio間のagent/question分離 |

### B7: Concurrent Operation（同時操作）  ← NEW

| Field | Value |
|-------|-------|
| ID | `concurrent-operation` |
| 目的 | 複数ユーザー/プロセスの同時操作における競合の発見 |
| 会話劇の構造 | 2人のユーザーが同時に同じリソースを編集/承認/削除する |
| 発見できるもの | 楽観ロックの不在、last-write-wins問題、通知の欠如 |
| 適用例 | 2人のoperatorが同時にtask priorityを変更する |

---

## Category C: 限界探索パターン（Stress Patterns）

システムの限界点やワークフロー自体の弱点を意図的に探す。

### C1: Scale Break（スケール破綻）

| Field | Value |
|-------|-------|
| ID | `scale-break` |
| 目的 | 大量データ・ユーザー時のパフォーマンス/UX問題の発見 |
| 会話劇の構造 | N=1で正常動作する操作を、N=1000, N=100000で実行する |
| 発見できるもの | ページネーション不在、タイムアウト、メモリ不足、UIの描画破綻 |

### C2: Hallucination Probe（幻覚探査）

| Field | Value |
|-------|-------|
| ID | `hallucination-probe` |
| 目的 | LLM生成の会話劇自体の信頼性を検証する |
| 会話劇の構造 | 意図的に存在しない機能について質問し、LLMが補完するかテストする |
| 発見できるもの | validate-dialogueの検出漏れ、negative constraint の弱さ |
| AskOS実績 | Story 11: パスワードリセットのhallucination発見 |

### C3: Convergence Test（収束テスト）

| Field | Value |
|-------|-------|
| ID | `convergence-test` |
| 目的 | DGEイテレーションの収束判定を検証する |
| 会話劇の構造 | 3回以上のDGE反復で、新規gap率の推移を観察する |
| 発見できるもの | 収束閾値の妥当性、矛盾するspec修正、終了条件の設計 |
| AskOS実績 | Story 12: ECサイトで3回ループしても収束しない問題 |

### C4: Drift Detection（乖離検出）

| Field | Value |
|-------|-------|
| ID | `drift-detection` |
| 目的 | DGE成果物と実装の乖離を発見する |
| 会話劇の構造 | 実装後に再度DGEを実行し、前回の成果物との差分を確認する |
| 発見できるもの | 実装中の設計変更の未反映、廃止された機能のドキュメント残存 |
| AskOS実績 | Story 13: 3ヶ月後のhandover文書の陳腐化 |

### C5: Security Adversary（セキュリティ攻撃者）  ← NEW

| Field | Value |
|-------|-------|
| ID | `security-adversary` |
| 目的 | 悪意あるユーザーの操作シナリオを発見する |
| 会話劇の構造 | 攻撃者ペルソナがシステムの穴を探す。SQL injection、権限昇格、データ窃取等 |
| 発見できるもの | 入力バリデーションの漏れ、認証バイパス、情報漏洩 |
| 適用例 | AskOSの質問回答にscript injectionを仕込む攻撃者 |

### C6: Accessibility Barrier（アクセシビリティ障壁）  ← NEW

| Field | Value |
|-------|-------|
| ID | `accessibility-barrier` |
| 目的 | アクセシビリティの障壁を発見する |
| 会話劇の構造 | スクリーンリーダー利用者、色覚特性を持つユーザー等がシステムを使う |
| 発見できるもの | aria-label不足、キーボードナビゲーション不備、コントラスト不足 |

### C7: Disaster Recovery（災害復旧）  ← NEW

| Field | Value |
|-------|-------|
| ID | `disaster-recovery` |
| 目的 | システム障害からの復旧パスを発見する |
| 会話劇の構造 | DB破損、サーバークラッシュ、ネットワーク断の後にシステムを復旧する |
| 発見できるもの | バックアップ手順の不在、データ整合性チェック、フェイルオーバー |
| 適用例 | AskOSのdocker volume prune後の復旧（askos-storiesの原点シナリオ） |

### C8: Internationalization Mismatch（国際化不一致）  ← NEW

| Field | Value |
|-------|-------|
| ID | `i18n-mismatch` |
| 目的 | 多言語・多地域対応の問題を発見する |
| 会話劇の構造 | 日本語/英語/その他の言語でシステムを使い、表示・入力・ソートの問題を探す |
| 発見できるもの | 文字化け、日付/通貨フォーマット、翻訳漏れ、RTL対応 |

---

## 推奨パターンセット（プリセット）

プロジェクトの状況に応じた推奨組み合わせ：

### 新規プロジェクト（`preset: new-project`）
```
zero-state, role-contrast, escalation-chain
```

### 既存プロジェクトの拡張（`preset: feature-extension`）
```
before-after, cross-persona-conflict, expertise-contrast
```

### リリース前チェック（`preset: pre-release`）
```
scale-break, security-adversary, concurrent-operation, disaster-recovery
```

### 手法導入の社内提案（`preset: advocacy`）
```
before-after, app-type-variation, role-contrast
```

### 網羅的DGE（`preset: comprehensive`）
```
zero-state, role-contrast, escalation-chain, cross-persona-conflict,
scale-break, security-adversary, migration-path
```

---

## Totals

```
3 Categories
  A: Comparison Patterns (5)
  B: Discovery Patterns (7)
  C: Stress Patterns (8)

20 patterns total
  13 from DGE-on-DGE stories
  7 NEW patterns added

5 preset combinations
```

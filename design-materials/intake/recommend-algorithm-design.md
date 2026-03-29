# DGE Session: axes ベクトル推奨アルゴリズムの設計

- **日付**: 2026-03-30
- **テーマ**: POST /characters/recommend の中身 — テーマから最適なキャラセットを axes ベクトルで算出するアルゴリズム
- **キャラクター**: 今泉 + ヤン + 千石 + ソウル + Red Team + 大和田
- **テンプレート**: api-design.md

---

## 推奨アルゴリズム

### 概要

```
1. テーマ分析（3 段階フォールバック）:
   LLM → keyword matching → テンプレート推奨テーブル

2. 要求ベクトル生成:
   ThemeRequirements { needs_quality, needs_security, ... } 各 0-1

3. キャラ選択（貪欲法 + marginal coverage）:
   for each candidate sorted by score:
     if marginal_gain > 0.1: select
     update covered vector

4. 今泉は default: true（外せる）

5. 不足視点を計算して警告
```

### ThemeRequirements 型

```typescript
interface ThemeRequirements {
  needs_quality_focus: number;
  needs_risk_assessment: number;
  needs_simplification: number;
  needs_bold_vision: number;
  needs_assumption_check: number;
  needs_financial_rigor: number;
  needs_legal_review: number;
  needs_user_empathy: number;
  needs_security: number;
  needs_scope_control: number;
}
```

### keyword → 要求ベクトル マッピング（v1）

```typescript
const KEYWORD_MAP: Record<string, Partial<ThemeRequirements>> = {
  "認証|auth|セキュリティ|security|暗号|token|JWT|OAuth":
    { needs_security: 0.9, needs_quality_focus: 0.6 },
  "品質|quality|テスト|test|バグ|bug|レビュー|review":
    { needs_quality_focus: 0.9 },
  "VC|投資|調達|revenue|売上|KPI|ROI|ビジネス":
    { needs_financial_rigor: 0.9, needs_bold_vision: 0.5 },
  "利用規約|ToS|GDPR|個人情報|プライバシー|法的|legal":
    { needs_legal_review: 0.9 },
  "パフォーマンス|スケール|scale|負荷|migration":
    { needs_risk_assessment: 0.8 },
  "新機能|feature|MVP|企画|要件":
    { needs_assumption_check: 0.8, needs_scope_control: 0.7, needs_user_empathy: 0.6 },
};
```

### キャラ coverage マッピング

```typescript
const CHARACTER_COVERAGE: Record<string, Partial<ThemeRequirements>> = {
  imaizumi:  { needs_assumption_check: 1.0, needs_simplification: 0.5 },
  sengoku:   { needs_quality_focus: 1.0, needs_user_empathy: 0.7 },
  yang:      { needs_simplification: 1.0, needs_scope_control: 0.6 },
  boku:      { needs_scope_control: 1.0, needs_user_empathy: 0.5 },
  reinhard:  { needs_bold_vision: 1.0 },
  owada:     { needs_financial_rigor: 0.8 },
  washizu:   { needs_financial_rigor: 1.0, needs_risk_assessment: 0.7 },
  levi:      { needs_quality_focus: 0.7, needs_simplification: 0.3 },
  tonegawa:  { needs_user_empathy: 1.0 },
  house:     { needs_risk_assessment: 0.9, needs_assumption_check: 0.6 },
  saul:      { needs_legal_review: 1.0 },
  red_team:  { needs_security: 1.0, needs_risk_assessment: 0.8 },
};
```

### recommend API レスポンス

```typescript
interface RecommendResponse {
  recommended: {
    id: string;
    name: string;
    icon: string;
    reason: string;
    score: number;
    default: boolean;
  }[];
  missing_perspectives: string[];
  coverage: Record<string, number>;
}
```

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 83 | ハードコード推奨の API 化だけでは価値不足 | Missing logic | **High** |
| 84 | テーマ→要求ベクトル変換方式（keyword vs LLM） | Missing logic | **High** |
| 85 | keyword のコンテキスト誤読リスク | Error quality | Medium |
| 86 | 推奨の強制度（推奨+警告、拒否しない） | Spec-impl mismatch | Medium |
| 87 | キャラ数上限（推奨3-5、警告6超） | Error quality | Low |
| 88 | 今泉の default: true 扱い | Spec-impl mismatch | Low |
| 89 | recommend API レスポンス形式 | Spec-impl mismatch | **High** |

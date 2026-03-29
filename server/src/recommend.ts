import db from "./db.js";

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

const KEYWORD_MAP: [RegExp, Partial<ThemeRequirements>][] = [
  [/認証|auth|セキュリティ|security|暗号|token|JWT|OAuth/i,
    { needs_security: 0.9, needs_quality_focus: 0.6 }],
  [/品質|quality|テスト|test|バグ|bug|レビュー|review/i,
    { needs_quality_focus: 0.9 }],
  [/VC|投資|調達|revenue|売上|KPI|ROI|ビジネス|business/i,
    { needs_financial_rigor: 0.9, needs_bold_vision: 0.5 }],
  [/利用規約|ToS|GDPR|個人情報|プライバシー|法的|legal/i,
    { needs_legal_review: 0.9 }],
  [/パフォーマンス|スケール|scale|負荷|migration|移行/i,
    { needs_risk_assessment: 0.8 }],
  [/新機能|feature|MVP|企画|要件|planning/i,
    { needs_assumption_check: 0.8, needs_scope_control: 0.7, needs_user_empathy: 0.6 }],
  [/障害|incident|failure|error|エラー/i,
    { needs_risk_assessment: 0.9, needs_quality_focus: 0.7 }],
  [/API|endpoint|エンドポイント/i,
    { needs_quality_focus: 0.7, needs_security: 0.5 }],
];

const TEMPLATE_DEFAULTS: Record<string, Partial<ThemeRequirements>> = {
  "api-design": { needs_quality_focus: 0.6, needs_security: 0.4, needs_assumption_check: 0.5 },
  "feature-planning": { needs_assumption_check: 0.7, needs_scope_control: 0.6, needs_user_empathy: 0.5 },
  "go-nogo": { needs_financial_rigor: 0.7, needs_risk_assessment: 0.6, needs_assumption_check: 0.5 },
  "incident-review": { needs_risk_assessment: 0.8, needs_quality_focus: 0.7 },
  "security-review": { needs_security: 0.9, needs_risk_assessment: 0.7 },
};

const CHARACTER_COVERAGE: Record<string, Partial<ThemeRequirements>> = {
  chr_imaizumi: { needs_assumption_check: 1.0, needs_simplification: 0.5 },
  chr_sengoku: { needs_quality_focus: 1.0, needs_user_empathy: 0.7 },
  chr_yang: { needs_simplification: 1.0, needs_scope_control: 0.6 },
  chr_boku: { needs_scope_control: 1.0, needs_user_empathy: 0.5 },
  chr_reinhard: { needs_bold_vision: 1.0 },
  chr_owada: { needs_financial_rigor: 0.8 },
  chr_washizu: { needs_financial_rigor: 1.0, needs_risk_assessment: 0.7 },
  chr_levi: { needs_quality_focus: 0.7, needs_simplification: 0.3 },
  chr_tonegawa: { needs_user_empathy: 1.0 },
  chr_house: { needs_risk_assessment: 0.9, needs_assumption_check: 0.6 },
  chr_saul: { needs_legal_review: 1.0 },
  chr_red_team: { needs_security: 1.0, needs_risk_assessment: 0.8 },
};

const AXIS_LABELS: Record<string, string> = {
  needs_quality_focus: "品質視点",
  needs_risk_assessment: "リスク評価",
  needs_simplification: "簡素化",
  needs_bold_vision: "大胆なビジョン",
  needs_assumption_check: "前提検証",
  needs_financial_rigor: "財務視点",
  needs_legal_review: "法務視点",
  needs_user_empathy: "ユーザー共感",
  needs_security: "セキュリティ",
  needs_scope_control: "スコープ制御",
};

function zeroVector(): ThemeRequirements {
  return {
    needs_quality_focus: 0, needs_risk_assessment: 0, needs_simplification: 0,
    needs_bold_vision: 0, needs_assumption_check: 0, needs_financial_rigor: 0,
    needs_legal_review: 0, needs_user_empathy: 0, needs_security: 0, needs_scope_control: 0,
  };
}

function mergeMax(a: Partial<ThemeRequirements>, b: Partial<ThemeRequirements>): ThemeRequirements {
  const result = zeroVector();
  for (const key of Object.keys(result) as (keyof ThemeRequirements)[]) {
    result[key] = Math.max(a[key] || 0, b[key] || 0);
  }
  return result;
}

function addVectors(a: ThemeRequirements, b: Partial<ThemeRequirements>): ThemeRequirements {
  const result = { ...a };
  for (const key of Object.keys(b) as (keyof ThemeRequirements)[]) {
    result[key] = Math.min(1.0, (result[key] || 0) + (b[key] || 0));
  }
  return result;
}

function dotProduct(a: ThemeRequirements, b: Partial<ThemeRequirements>): number {
  let sum = 0;
  for (const key of Object.keys(a) as (keyof ThemeRequirements)[]) {
    sum += a[key] * (b[key] || 0);
  }
  return sum;
}

function marginalGain(charCoverage: Partial<ThemeRequirements>, covered: ThemeRequirements, requirements: ThemeRequirements): number {
  let gain = 0;
  for (const key of Object.keys(requirements) as (keyof ThemeRequirements)[]) {
    const needed = requirements[key];
    const alreadyCovered = covered[key];
    const charProvides = charCoverage[key] || 0;
    if (needed > 0.3 && alreadyCovered < 0.5) {
      gain += charProvides * needed;
    }
  }
  return gain;
}

function analyzeTheme(agenda: string, template?: string): ThemeRequirements {
  const base = template && TEMPLATE_DEFAULTS[template] ? TEMPLATE_DEFAULTS[template] : {};
  let boost = zeroVector();
  for (const [regex, req] of KEYWORD_MAP) {
    if (regex.test(agenda)) {
      boost = mergeMax(boost, req);
    }
  }
  return mergeMax(base, boost);
}

export interface RecommendedCharacter {
  id: string;
  name: string;
  icon: string;
  reason: string;
  score: number;
  default: boolean;
}

export interface RecommendResponse {
  recommended: RecommendedCharacter[];
  missing_perspectives: string[];
  coverage: Record<string, number>;
  method: "keyword" | "llm" | "default";
}

export function recommend(agenda: string, template?: string, max: number = 4): RecommendResponse {
  const requirements = analyzeTheme(agenda, template);
  const allChars = db.prepare("SELECT * FROM characters WHERE is_builtin = 1").all() as any[];

  const selected: RecommendedCharacter[] = [];
  let covered = zeroVector();

  // Always include Imaizumi as default
  const imaizumi = allChars.find(c => c.id === "chr_imaizumi");
  if (imaizumi) {
    const coverage = CHARACTER_COVERAGE[imaizumi.id] || {};
    selected.push({
      id: imaizumi.id, name: imaizumi.name, icon: imaizumi.icon,
      reason: "前提検証（デフォルト）", score: dotProduct(requirements, coverage),
      default: true,
    });
    covered = addVectors(covered, coverage);
  }

  // Greedy selection
  const remaining = allChars.filter(c => c.id !== "chr_imaizumi");
  while (selected.length < max) {
    let bestChar: any = null;
    let bestGain = 0;
    let bestCoverage: Partial<ThemeRequirements> = {};

    for (const c of remaining) {
      if (selected.some(s => s.id === c.id)) continue;
      const cov = CHARACTER_COVERAGE[c.id] || {};
      const gain = marginalGain(cov, covered, requirements);
      if (gain > bestGain) {
        bestChar = c;
        bestGain = gain;
        bestCoverage = cov;
      }
    }

    if (!bestChar || bestGain < 0.1) break;

    // Generate reason from highest contributing axis
    let bestAxis = "";
    let bestAxisValue = 0;
    for (const key of Object.keys(bestCoverage) as (keyof ThemeRequirements)[]) {
      if ((bestCoverage[key] || 0) > bestAxisValue && requirements[key] > 0.3) {
        bestAxisValue = bestCoverage[key] || 0;
        bestAxis = AXIS_LABELS[key] || key;
      }
    }

    selected.push({
      id: bestChar.id, name: bestChar.name, icon: bestChar.icon,
      reason: bestAxis || "多様性",
      score: Math.round(dotProduct(requirements, bestCoverage) * 100) / 100,
      default: false,
    });
    covered = addVectors(covered, bestCoverage);
  }

  // Missing perspectives
  const missing: string[] = [];
  for (const key of Object.keys(requirements) as (keyof ThemeRequirements)[]) {
    if (requirements[key] > 0.5 && covered[key] < 0.3) {
      // Find best char for this axis
      let bestId = "";
      let bestVal = 0;
      for (const [id, cov] of Object.entries(CHARACTER_COVERAGE)) {
        if ((cov[key] || 0) > bestVal && !selected.some(s => s.id === id)) {
          bestVal = cov[key] || 0;
          const char = allChars.find(c => c.id === id);
          if (char) bestId = char.name;
        }
      }
      const label = AXIS_LABELS[key] || key;
      missing.push(bestId ? `${label}が不足 — ${bestId} の追加を検討` : `${label}が不足`);
    }
  }

  const method = Object.values(requirements).some(v => v > 0) ? "keyword" : "default";

  return {
    recommended: selected,
    missing_perspectives: missing,
    coverage: covered as unknown as Record<string, number>,
    method,
  };
}

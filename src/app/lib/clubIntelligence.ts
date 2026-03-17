import { slugify } from "./contentPaths";

export interface ClubIntelligence {
  club: string;
  xGPer90: number;
  xGAPer90: number;
  shotsOnTargetPer90: number;
  keyPassesPer90: number;
  progressivePassesPer90: number;
  progressiveCarriesPer90: number;
  possessionPct: number;
  tacklesWonPer90: number;
  interceptionsPer90: number;
  aerialWinPct: number;
  note: string;
  updatedAt: string;
}

export interface ClubIntelligenceSummary {
  styleBars: Array<{ label: string; value: number }>;
  styleTags: string[];
  attackIndex: number;
  controlIndex: number;
  defensiveIndex: number;
  overallScore: number;
  overallLabel: string;
}

const DEFAULT_VALUES: Omit<ClubIntelligence, "club" | "updatedAt"> = {
  xGPer90: 1.4,
  xGAPer90: 1.4,
  shotsOnTargetPer90: 4.5,
  keyPassesPer90: 10,
  progressivePassesPer90: 28,
  progressiveCarriesPer90: 14,
  possessionPct: 50,
  tacklesWonPer90: 9,
  interceptionsPer90: 8,
  aerialWinPct: 50,
  note: "",
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 60) return "Positive";
  if (score >= 45) return "Mixed";
  return "Fragile";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scaleMetric(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function inverseScaleMetric(value: number, goodMin: number, badMax: number): number {
  if (badMax <= goodMin) return 50;
  const normalized = ((badMax - value) / (badMax - goodMin)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

export function getClubIntelligenceKey(club: string): string {
  return slugify(club);
}

export function createDefaultClubIntelligence(club: string): ClubIntelligence {
  return {
    club,
    ...DEFAULT_VALUES,
    updatedAt: "",
  };
}

export function normalizeClubIntelligence(input?: Partial<ClubIntelligence> | null, fallbackClub = ""): ClubIntelligence {
  return {
    club: String(input?.club || fallbackClub || "").trim(),
    xGPer90: clampNumber(input?.xGPer90, 0, 3, DEFAULT_VALUES.xGPer90),
    xGAPer90: clampNumber(input?.xGAPer90, 0, 3, DEFAULT_VALUES.xGAPer90),
    shotsOnTargetPer90: clampNumber(input?.shotsOnTargetPer90, 0, 10, DEFAULT_VALUES.shotsOnTargetPer90),
    keyPassesPer90: clampNumber(input?.keyPassesPer90, 0, 20, DEFAULT_VALUES.keyPassesPer90),
    progressivePassesPer90: clampNumber(input?.progressivePassesPer90, 0, 80, DEFAULT_VALUES.progressivePassesPer90),
    progressiveCarriesPer90: clampNumber(input?.progressiveCarriesPer90, 0, 40, DEFAULT_VALUES.progressiveCarriesPer90),
    possessionPct: clampNumber(input?.possessionPct, 0, 100, DEFAULT_VALUES.possessionPct),
    tacklesWonPer90: clampNumber(input?.tacklesWonPer90, 0, 20, DEFAULT_VALUES.tacklesWonPer90),
    interceptionsPer90: clampNumber(input?.interceptionsPer90, 0, 20, DEFAULT_VALUES.interceptionsPer90),
    aerialWinPct: clampNumber(input?.aerialWinPct, 0, 100, DEFAULT_VALUES.aerialWinPct),
    note: String(input?.note || "").trim(),
    updatedAt: String(input?.updatedAt || ""),
  };
}

export function calculateClubIntelligenceSummary(data: ClubIntelligence): ClubIntelligenceSummary {
  const goalThreat = average([
    scaleMetric(data.xGPer90, 0.6, 2.4),
    scaleMetric(data.shotsOnTargetPer90, 2.5, 6.5),
  ]);

  const chanceCreation = average([
    scaleMetric(data.keyPassesPer90, 5, 16),
    scaleMetric(data.xGPer90, 0.6, 2.4),
  ]);

  const progression = average([
    scaleMetric(data.progressivePassesPer90, 15, 55),
    scaleMetric(data.progressiveCarriesPer90, 8, 25),
  ]);

  const control = average([
    scaleMetric(data.possessionPct, 38, 68),
    scaleMetric(data.progressivePassesPer90, 15, 55),
  ]);

  const defensiveIntensity = average([
    scaleMetric(data.tacklesWonPer90, 6, 14),
    scaleMetric(data.interceptionsPer90, 5, 12),
  ]);

  const defensiveShield = average([
    inverseScaleMetric(data.xGAPer90, 0.7, 2.2),
    scaleMetric(data.aerialWinPct, 42, 62),
  ]);

  const styleBars = [
    { label: "Goal Threat", value: goalThreat },
    { label: "Chance Creation", value: chanceCreation },
    { label: "Progression", value: progression },
    { label: "Control", value: control },
    { label: "Defensive Intensity", value: defensiveIntensity },
    { label: "Defensive Shield", value: defensiveShield },
  ];

  const styleTags = [...styleBars]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((item) => item.label);

  const attackIndex = average([goalThreat, chanceCreation]);
  const controlIndex = average([progression, control]);
  const defensiveIndex = average([defensiveIntensity, defensiveShield]);
  const overallScore = average([attackIndex, controlIndex, defensiveIndex]);

  return {
    styleBars,
    styleTags,
    attackIndex,
    controlIndex,
    defensiveIndex,
    overallScore,
    overallLabel: scoreLabel(overallScore),
  };
}

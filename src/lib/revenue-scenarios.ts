import type {
  RevenueAssumption,
  RevenueModel,
  RevenueProductSummary,
  RevenueWeeklyTrendPoint,
} from "@/lib/abaxx";

export type RevenueScenarioPresetId = "base" | "conservative" | "bull";

export type RevenueScenarioPreset = {
  id: RevenueScenarioPresetId;
  label: string;
  description: string;
  multiplier: number;
};

export const REVENUE_SCENARIO_PRESETS: RevenueScenarioPreset[] = [
  {
    id: "base",
    label: "Base",
    description: "Current fee schedule with no adjustments.",
    multiplier: 1,
  },
  {
    id: "conservative",
    label: "Conservative",
    description: "Reduce each fee group by 20% to test a lower-take-rate case.",
    multiplier: 0.8,
  },
  {
    id: "bull",
    label: "Bull",
    description: "Increase each fee group by 20% to test a stronger pricing case.",
    multiplier: 1.2,
  },
];

export function buildScenarioFeeMap(
  assumptions: RevenueAssumption[],
  presetId: RevenueScenarioPresetId,
): Record<string, number> {
  const preset =
    REVENUE_SCENARIO_PRESETS.find((item) => item.id === presetId) ??
    REVENUE_SCENARIO_PRESETS[0];

  return Object.fromEntries(
    assumptions.map((assumption) => [
      assumption.id,
      roundTo(assumption.feePerSide * preset.multiplier, 2),
    ]),
  );
}

export function computeRevenueScenario(
  revenueModel: RevenueModel,
  feesByAssumptionId: Record<string, number>,
): RevenueModel {
  const normalizedFees = new Map(
    revenueModel.assumptions.map((assumption) => [
      assumption.id,
      normalizeFeeInput(feesByAssumptionId[assumption.id], assumption.feePerSide),
    ]),
  );
  const assumptions = revenueModel.assumptions.map((assumption) => ({
    ...assumption,
    feePerSide: normalizedFees.get(assumption.id) ?? assumption.feePerSide,
  }));

  const productSummaries = revenueModel.productSummaries
    .map((summary) => recalculateProductSummary(summary, normalizedFees))
    .sort(compareRevenueProductSummaries);
  const latestEstimatedRevenue = roundTo(
    productSummaries.reduce(
      (total, summary) => total + (summary.latestEstimatedRevenue ?? 0),
      0,
    ),
    2,
  );
  const finalizedProductSummaries = productSummaries.map((summary) => ({
    ...summary,
    revenueShare:
      summary.latestEstimatedRevenue === null || latestEstimatedRevenue === 0
        ? null
        : roundTo((summary.latestEstimatedRevenue / latestEstimatedRevenue) * 100, 2),
  }));
  const weeklyTrends = revenueModel.weeklyTrends.map((trend) =>
    recalculateWeeklyTrend(trend, normalizedFees),
  );
  const latestWeekRevenue = weeklyTrends.at(-1)?.estimatedRevenue ?? 0;

  return {
    ...revenueModel,
    assumptions,
    latestEstimatedRevenue,
    latestWeekRevenue: roundTo(latestWeekRevenue, 2),
    annualizedRunRate: roundTo(latestWeekRevenue * 52, 2),
    quarterlyRunRate: roundTo(latestWeekRevenue * 13, 2),
    productSummaries: finalizedProductSummaries,
    weeklyTrends,
  };
}

function recalculateProductSummary(
  summary: RevenueProductSummary,
  normalizedFees: Map<string, number>,
): RevenueProductSummary {
  if (!summary.assumptionId) {
    return {
      ...summary,
      feePerSide: null,
      latestEstimatedRevenue: null,
      revenueShare: null,
    };
  }

  const feePerSide = normalizedFees.get(summary.assumptionId) ?? summary.feePerSide ?? 0;
  const latestEstimatedRevenue = roundTo(
    estimateRevenue(summary.latestVolume, feePerSide),
    2,
  );

  return {
    ...summary,
    feePerSide,
    latestEstimatedRevenue,
    revenueShare: null,
  };
}

function recalculateWeeklyTrend(
  trend: RevenueWeeklyTrendPoint,
  normalizedFees: Map<string, number>,
): RevenueWeeklyTrendPoint {
  const estimatedRevenue = trend.assumptionVolumes.reduce((total, bucket) => {
    const feePerSide = normalizedFees.get(bucket.assumptionId);
    return feePerSide === undefined
      ? total
      : total + estimateRevenue(bucket.volume, feePerSide);
  }, 0);

  return {
    ...trend,
    estimatedRevenue: roundTo(estimatedRevenue, 2),
  };
}

function compareRevenueProductSummaries(
  left: RevenueProductSummary,
  right: RevenueProductSummary,
): number {
  return (
    (right.latestEstimatedRevenue ?? -1) - (left.latestEstimatedRevenue ?? -1) ||
    right.latestVolume - left.latestVolume ||
    left.product.localeCompare(right.product)
  );
}

function normalizeFeeInput(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return roundTo(value, 2);
}

function estimateRevenue(volume: number, feePerSide: number): number {
  return volume * feePerSide * 2;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

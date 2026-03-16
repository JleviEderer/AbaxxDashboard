import { describe, expect, it } from "vitest";

import type { RevenueModel } from "./abaxx";
import { buildScenarioFeeMap, computeRevenueScenario } from "./revenue-scenarios";

const revenueModelFixture: RevenueModel = {
  assumptions: [
    {
      id: "lng",
      label: "LNG",
      feePerSide: 5,
      products: ["GOM"],
    },
    {
      id: "carbon",
      label: "Carbon",
      feePerSide: 0.5,
      products: ["CP1"],
    },
  ],
  latestEstimatedRevenue: 6415,
  latestModeledVolume: 691,
  latestTotalVolume: 691,
  latestVolumeCoverage: 100,
  latestWeekRevenue: 6415,
  annualizedRunRate: 333580,
  quarterlyRunRate: 83395,
  pricedProducts: 2,
  unpricedProducts: [],
  productSummaries: [
    {
      product: "GOM",
      assumptionId: "lng",
      pricingGroup: "LNG",
      feePerSide: 5,
      latestVolume: 636,
      latestOpenInterest: 3,
      latestEstimatedRevenue: 6360,
      revenueShare: 99.14,
    },
    {
      product: "CP1",
      assumptionId: "carbon",
      pricingGroup: "Carbon",
      feePerSide: 0.5,
      latestVolume: 55,
      latestOpenInterest: 50,
      latestEstimatedRevenue: 55,
      revenueShare: 0.86,
    },
  ],
  weeklyTrends: [
    {
      periodStart: "2026-03-02",
      periodEnd: "2026-03-05",
      estimatedRevenue: 1000,
      pricedVolume: 100,
      totalVolume: 100,
      pricedProducts: 1,
      assumptionVolumes: [
        {
          assumptionId: "lng",
          label: "LNG",
          volume: 100,
          products: ["GOM"],
        },
      ],
    },
    {
      periodStart: "2026-03-09",
      periodEnd: "2026-03-12",
      estimatedRevenue: 6415,
      pricedVolume: 691,
      totalVolume: 691,
      pricedProducts: 2,
      assumptionVolumes: [
        {
          assumptionId: "lng",
          label: "LNG",
          volume: 636,
          products: ["GOM"],
        },
        {
          assumptionId: "carbon",
          label: "Carbon",
          volume: 55,
          products: ["CP1"],
        },
      ],
    },
  ],
};

describe("revenue scenarios", () => {
  it("builds scenario fees from the selected preset", () => {
    expect(buildScenarioFeeMap(revenueModelFixture.assumptions, "base")).toEqual({
      lng: 5,
      carbon: 0.5,
    });
    expect(
      buildScenarioFeeMap(revenueModelFixture.assumptions, "conservative"),
    ).toEqual({
      lng: 4,
      carbon: 0.4,
    });
    expect(buildScenarioFeeMap(revenueModelFixture.assumptions, "bull")).toEqual({
      lng: 6,
      carbon: 0.6,
    });
  });

  it("recomputes modeled outputs from fee overrides", () => {
    const scenario = computeRevenueScenario(revenueModelFixture, {
      lng: 4,
      carbon: 0.4,
    });

    expect(scenario.assumptions).toEqual([
      {
        id: "lng",
        label: "LNG",
        feePerSide: 4,
        products: ["GOM"],
      },
      {
        id: "carbon",
        label: "Carbon",
        feePerSide: 0.4,
        products: ["CP1"],
      },
    ]);
    expect(scenario.latestEstimatedRevenue).toBe(5132);
    expect(scenario.latestWeekRevenue).toBe(5132);
    expect(scenario.annualizedRunRate).toBe(266864);
    expect(scenario.quarterlyRunRate).toBe(66716);
    expect(scenario.productSummaries).toEqual([
      {
        product: "GOM",
        assumptionId: "lng",
        pricingGroup: "LNG",
        feePerSide: 4,
        latestVolume: 636,
        latestOpenInterest: 3,
        latestEstimatedRevenue: 5088,
        revenueShare: 99.14,
      },
      {
        product: "CP1",
        assumptionId: "carbon",
        pricingGroup: "Carbon",
        feePerSide: 0.4,
        latestVolume: 55,
        latestOpenInterest: 50,
        latestEstimatedRevenue: 44,
        revenueShare: 0.86,
      },
    ]);
    expect(scenario.weeklyTrends[1]).toEqual({
      periodStart: "2026-03-09",
      periodEnd: "2026-03-12",
      estimatedRevenue: 5132,
      pricedVolume: 691,
      totalVolume: 691,
      pricedProducts: 2,
      assumptionVolumes: [
        {
          assumptionId: "lng",
          label: "LNG",
          volume: 636,
          products: ["GOM"],
        },
        {
          assumptionId: "carbon",
          label: "Carbon",
          volume: 55,
          products: ["CP1"],
        },
      ],
    });
  });
});

import { describe, expect, it } from "vitest";

import type { DashboardSnapshot } from "./abaxx";
import {
  buildProductRankingRows,
  filterAndSortProductRankings,
  getProductRankingValue,
} from "./product-rankings";

type ProductDrilldown = DashboardSnapshot["productDrilldowns"][number];

const drilldowns: ProductDrilldown[] = [
  createDrilldown({
    product: "GOM",
    market: "Energy",
    listedContracts: 4,
    activeContracts: 4,
    pricedContracts: 3,
    totalVolume: 600,
    openInterest: 320,
    latestEstimatedRevenue: 6000,
    revenueShare: 60,
    pricingGroup: "LNG",
    frontSymbol: "GOMK26",
  }),
  createDrilldown({
    product: "CP1",
    market: "Environmental",
    listedContracts: 2,
    activeContracts: 1,
    pricedContracts: 1,
    totalVolume: 220,
    openInterest: 150,
    latestEstimatedRevenue: 220,
    revenueShare: 2.2,
    pricingGroup: "Carbon",
    frontSymbol: "CP1J26",
  }),
  createDrilldown({
    product: "NWE",
    market: "Energy",
    listedContracts: 3,
    activeContracts: 0,
    pricedContracts: 0,
    totalVolume: 30,
    openInterest: 0,
    latestEstimatedRevenue: null,
    revenueShare: null,
    pricingGroup: null,
    frontSymbol: null,
  }),
];

describe("product ranking helpers", () => {
  it("builds derived ranking rows from drilldowns", () => {
    const rows = buildProductRankingRows(drilldowns);

    expect(rows[0]).toMatchObject({
      product: "GOM",
      marketLabel: "Energy",
      pricingStatus: "priced",
      volumePerActiveContract: 150,
      openInterestPerActiveContract: 80,
      feesPerActiveContract: 1500,
    });
    expect(rows[2]).toMatchObject({
      product: "NWE",
      pricingStatus: "unpriced",
      volumePerActiveContract: null,
      feesPerActiveContract: null,
    });
  });

  it("sorts absolute and normalized modes differently", () => {
    const rows = buildProductRankingRows(drilldowns);
    const absoluteRows = filterAndSortProductRankings(rows, {
      mode: "absoluteVolume",
    });
    const normalizedRows = filterAndSortProductRankings(rows, {
      mode: "volumePerActiveContract",
      pricing: "priced",
    });

    expect(absoluteRows.map((row) => row.product)).toEqual(["GOM", "CP1", "NWE"]);
    expect(normalizedRows.map((row) => row.product)).toEqual(["CP1", "GOM"]);
    expect(getProductRankingValue(normalizedRows[0]!, "volumePerActiveContract")).toBe(
      220,
    );
  });

  it("filters by market and pricing coverage", () => {
    const rows = buildProductRankingRows(drilldowns);

    expect(
      filterAndSortProductRankings(rows, {
        mode: "modeledFees",
        market: "Energy",
        pricing: "priced",
      }).map((row) => row.product),
    ).toEqual(["GOM"]);

    expect(
      filterAndSortProductRankings(rows, {
        mode: "modeledFees",
        pricing: "unpriced",
      }).map((row) => row.product),
    ).toEqual(["NWE"]);
  });
});

function createDrilldown(
  overrides: Partial<ProductDrilldown> & { product: string },
): ProductDrilldown {
  const { product, ...rest } = overrides;

  return {
    product,
    market: null,
    inCatalog: true,
    listedContracts: 0,
    activeContracts: 0,
    pricedContracts: 0,
    totalVolume: 0,
    openInterest: 0,
    frontSymbol: null,
    frontExpiry: null,
    frontSettle: null,
    frontSettleChange: null,
    curveSpread: null,
    curveDirection: "unclassified" as const,
    pricingGroup: null,
    feePerSide: null,
    latestEstimatedRevenue: null,
    revenueShare: null,
    contractDetails: [],
    weeklyTrends: [],
    ...rest,
  };
}

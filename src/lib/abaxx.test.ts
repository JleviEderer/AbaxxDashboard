import { describe, expect, it } from "vitest";
import {
  buildDashboardSnapshot,
  buildHistoricalUrl,
  buildHistoricalTimeSeriesUrl,
  buildInstrumentsUrl,
  buildProductsUrl,
  buildSettlementUrl,
  fetchDashboardSnapshot,
  normalizeHistorical,
  normalizeInstruments,
  normalizeProducts,
  normalizeSettlement,
  resolveMarketDataBaseUrl,
  resolveSnapshotNow,
  unwrapCollection,
} from "./abaxx";

describe("abaxx helpers", () => {
  it("builds the products url without duplicate slashes", () => {
    expect(buildProductsUrl("https://example.com/")).toBe(
      "https://example.com/products",
    );
  });

  it("encodes instrument product parameters", () => {
    expect(buildInstrumentsUrl("LNG Singapore")).toBe(
      "https://abaxx.exchange/api/instruments?product=LNG%20Singapore",
    );
  });

  it("builds the historical url with an asof parameter", () => {
    expect(buildHistoricalUrl("2026-03-12", "https://example.com/")).toBe(
      "https://example.com/historical-data?asof=2026-03-12",
    );
  });

  it("builds the settlement url with an asof parameter", () => {
    expect(buildSettlementUrl("2026-03-12", "https://example.com/")).toBe(
      "https://example.com/settlement-data?asof=2026-03-12",
    );
  });

  it("builds the historical time-series url with date range filters", () => {
    expect(
      buildHistoricalTimeSeriesUrl("2026-02-27", "2026-03-12", {
        product: "GOM",
        instrument: "GOMK26",
        baseUrl: "https://example.com/",
      }),
    ).toBe(
      "https://example.com/historical-data/time-series?from_date=2026-02-27&till_date=2026-03-12&product=GOM&instrument=GOMK26",
    );
  });

  it("prefers an explicit market-data base url override", () => {
    expect(resolveMarketDataBaseUrl("https://fixture.local/api")).toBe(
      "https://fixture.local/api",
    );
  });

  it("prefers an explicit snapshot date override", () => {
    const now = new Date("2026-03-13T12:00:00Z");
    expect(resolveSnapshotNow(now).toISOString()).toBe(now.toISOString());
  });

  it("unwraps common collection shapes", () => {
    expect(unwrapCollection([{ id: "one" }])).toEqual([{ id: "one" }]);
    expect(unwrapCollection({ data: [{ id: "two" }] })).toEqual([{ id: "two" }]);
    expect(unwrapCollection({ products: [{ id: "three" }] })).toEqual([
      { id: "three" },
    ]);
  });

  it("normalizes product records from mixed payload keys", () => {
    const normalized = normalizeProducts({
      data: [
        "GOM",
        { id: "1", name: "Carbon Futures" },
        { productCode: "LNG", displayName: "LNG Contracts" },
        { symbol: "BAD" },
      ],
    });

    expect(normalized).toEqual([
      {
        id: "GOM",
        label: "GOM",
        raw: "GOM",
      },
      {
        id: "1",
        label: "Carbon Futures",
        raw: { id: "1", name: "Carbon Futures" },
      },
      {
        id: "LNG",
        label: "LNG Contracts",
        raw: { productCode: "LNG", displayName: "LNG Contracts" },
      },
      {
        id: "BAD",
        label: "BAD",
        raw: { symbol: "BAD" },
      },
    ]);
  });

  it("normalizes instruments from the public api shape", () => {
    const normalized = normalizeInstruments({
      data: [
        {
          display_name: "GOMK26 (May)",
          market: "Energy",
          product: "GOM",
          symbol: "GOMK26",
        },
      ],
    });

    expect(normalized).toEqual([
      {
        symbol: "GOMK26",
        label: "GOMK26 (May)",
        product: "GOM",
        expiry: null,
        market: "Energy",
        raw: {
          display_name: "GOMK26 (May)",
          market: "Energy",
          product: "GOM",
          symbol: "GOMK26",
        },
      },
    ]);
  });

  it("normalizes historical rows with numeric strings", () => {
    const normalized = normalizeHistorical({
      data: [
        {
          display_name: "CP1J26 (Apr)",
          expiry: "2026-03-30",
          open_interest: "50",
          product: "CP1",
          settle: "14.74",
          settle_change: "0.01",
          symbol: "CP1J26",
          total_volume: 55,
          trade_date: "2026-03-12",
        },
      ],
    });

    expect(normalized).toEqual([
      {
        symbol: "CP1J26",
        label: "CP1J26 (Apr)",
        product: "CP1",
        expiry: "2026-03-30",
        tradeDate: "2026-03-12",
        settle: 14.74,
        settleChange: 0.01,
        totalVolume: 55,
        openInterest: 50,
        raw: {
          display_name: "CP1J26 (Apr)",
          expiry: "2026-03-30",
          open_interest: "50",
          product: "CP1",
          settle: "14.74",
          settle_change: "0.01",
          symbol: "CP1J26",
          total_volume: 55,
          trade_date: "2026-03-12",
        },
      },
    ]);
  });

  it("normalizes settlement rows with prior settle values", () => {
    const normalized = normalizeSettlement({
      data: [
        {
          display_name: "CP1J26 (Apr)",
          expiry: "2026-03-30",
          pre_settle: "14.73",
          product: "CP1",
          settle: "14.74",
          settle_change: "0.01",
          symbol: "CP1J26",
          trade_date: "2026-03-12",
        },
      ],
    });

    expect(normalized).toEqual([
      {
        symbol: "CP1J26",
        label: "CP1J26 (Apr)",
        product: "CP1",
        expiry: "2026-03-30",
        tradeDate: "2026-03-12",
        preSettle: 14.73,
        settle: 14.74,
        settleChange: 0.01,
        raw: {
          display_name: "CP1J26 (Apr)",
          expiry: "2026-03-30",
          pre_settle: "14.73",
          product: "CP1",
          settle: "14.74",
          settle_change: "0.01",
          symbol: "CP1J26",
          trade_date: "2026-03-12",
        },
      },
    ]);
  });

  it("builds a dashboard snapshot from product, instrument, and history inputs", () => {
    const snapshot = buildDashboardSnapshot({
      asOf: "2026-03-12",
      products: [{ id: "GOM", label: "GOM", raw: "GOM" }],
      instruments: [
        {
          symbol: "GOMK26",
          label: "GOMK26 (May)",
          product: "GOM",
          expiry: "2026-04-01",
          market: "Energy",
          raw: { symbol: "GOMK26" },
        },
      ],
      historical: [
        {
          symbol: "GOMK26",
          label: "GOMK26 (May)",
          product: "GOM",
          expiry: "2026-04-01",
          tradeDate: "2026-03-12",
          settle: 12.5,
          settleChange: -0.4,
          totalVolume: 636,
          openInterest: 3,
          raw: { symbol: "GOMK26" },
        },
        {
          symbol: "NWEZ26",
          label: "NWEZ26 (Dec)",
          product: "NWE",
          expiry: "2026-11-01",
          tradeDate: "2026-03-12",
          settle: 10,
          settleChange: 0.1,
          totalVolume: 0,
          openInterest: 0,
          raw: { symbol: "NWEZ26" },
        },
      ],
      settlements: [
        {
          symbol: "GOMK26",
          label: "GOMK26 (May)",
          product: "GOM",
          expiry: "2026-04-01",
          tradeDate: "2026-03-12",
          preSettle: 12.1,
          settle: 12.5,
          settleChange: 0.4,
          raw: { symbol: "GOMK26" },
        },
        {
          symbol: "GOMM26",
          label: "GOMM26 (Jun)",
          product: "GOM",
          expiry: "2026-05-01",
          tradeDate: "2026-03-12",
          preSettle: 12.6,
          settle: 13.2,
          settleChange: 0.6,
          raw: { symbol: "GOMM26" },
        },
      ],
      timeSeries: [
        {
          symbol: "GOMK26",
          label: "GOMK26 (May)",
          product: "GOM",
          expiry: "2026-04-01",
          tradeDate: "2026-03-05",
          settle: 11.9,
          settleChange: 0.2,
          totalVolume: 100,
          openInterest: 2,
          raw: { symbol: "GOMK26" },
        },
        {
          symbol: "GOMK26",
          label: "GOMK26 (May)",
          product: "GOM",
          expiry: "2026-04-01",
          tradeDate: "2026-03-12",
          settle: 12.5,
          settleChange: -0.4,
          totalVolume: 636,
          openInterest: 3,
          raw: { symbol: "GOMK26" },
        },
        {
          symbol: "CP1J26",
          label: "CP1J26 (Apr)",
          product: "CP1",
          expiry: "2026-03-30",
          tradeDate: "2026-03-12",
          settle: 14.74,
          settleChange: 0.01,
          totalVolume: 55,
          openInterest: 50,
          raw: { symbol: "CP1J26" },
        },
      ],
      timeSeriesWindow: {
        fromDate: "2026-02-27",
        tillDate: "2026-03-12",
        lookbackDays: 14,
      },
    });

    expect(snapshot.stats).toEqual({
      catalogProducts: 1,
      surfaceProducts: 2,
      listedContracts: 1,
      markets: 1,
      activeContracts: 1,
      activeProducts: 1,
      settledContracts: 2,
      settledProducts: 1,
      totalVolume: 636,
      openInterest: 3,
      modeledRevenue: 6360,
    });

    expect(snapshot.historyOnlyProducts).toEqual(["NWE"]);
    expect(snapshot.settlementSummaries).toEqual([
      {
        product: "GOM",
        pricedContracts: 2,
        tradeDate: "2026-03-12",
        frontSymbol: "GOMK26",
        frontExpiry: "2026-04-01",
        frontSettle: 12.5,
        frontSettleChange: 0.4,
        backSymbol: "GOMM26",
        backExpiry: "2026-05-01",
        backSettle: 13.2,
        averageSettle: 12.85,
        averageSettleChange: 0.5,
        curveSpread: 0.7,
        curveDirection: "contango",
      },
    ]);
    expect(snapshot.revenueModel).toMatchObject({
      latestEstimatedRevenue: 6360,
      latestModeledVolume: 636,
      latestTotalVolume: 636,
      latestVolumeCoverage: 100,
      latestWeekRevenue: 6415,
      annualizedRunRate: 333580,
      quarterlyRunRate: 83395,
      pricedProducts: 2,
      unpricedProducts: [],
    });
    expect(snapshot.revenueModel.productSummaries[0]).toMatchObject({
      product: "GOM",
      assumptionId: "lng",
      pricingGroup: "LNG",
      feePerSide: 5,
      latestEstimatedRevenue: 6360,
      revenueShare: 100,
    });
    expect(snapshot.productDrilldowns[0]).toMatchObject({
      product: "GOM",
      market: "Energy",
      listedContracts: 1,
      activeContracts: 1,
      pricedContracts: 2,
      totalVolume: 636,
      openInterest: 3,
      pricingGroup: "LNG",
      latestEstimatedRevenue: 6360,
      curveSpread: 0.7,
      curveDirection: "contango",
    });
    expect(snapshot.productDrilldowns[0]?.weeklyTrends).toEqual([
      {
        periodStart: "2026-03-02",
        periodEnd: "2026-03-05",
        totalVolume: 100,
        openInterest: 2,
        activeContracts: 1,
        activeProducts: 1,
        estimatedRevenue: 1000,
        pricedVolume: 100,
      },
      {
        periodStart: "2026-03-09",
        periodEnd: "2026-03-12",
        totalVolume: 636,
        openInterest: 3,
        activeContracts: 1,
        activeProducts: 1,
        estimatedRevenue: 6360,
        pricedVolume: 636,
      },
    ]);
    expect(snapshot.productDrilldowns[0]?.contractDetails).toEqual([
      {
        symbol: "GOMK26",
        label: "GOMK26 (May)",
        expiry: "2026-04-01",
        listed: true,
        active: true,
        hasSettlement: true,
        latestVolume: 636,
        latestOpenInterest: 3,
        snapshotSettle: 12.5,
        snapshotSettleChange: -0.4,
        settlementMark: 12.5,
        settlementChange: 0.4,
      },
      {
        symbol: "GOMM26",
        label: "GOMM26 (Jun)",
        expiry: "2026-05-01",
        listed: false,
        active: false,
        hasSettlement: true,
        latestVolume: 0,
        latestOpenInterest: 0,
        snapshotSettle: null,
        snapshotSettleChange: null,
        settlementMark: 13.2,
        settlementChange: 0.6,
      },
    ]);
    expect(snapshot.productSummaries[0]).toMatchObject({
      product: "GOM",
      market: "Energy",
      inCatalog: true,
      listedContracts: 1,
      activeContracts: 1,
      totalVolume: 636,
      openInterest: 3,
      frontSymbol: "GOMK26",
      frontSettle: 12.5,
      frontSettleChange: -0.4,
    });
    expect(snapshot.dailyTrends).toEqual([
      {
        tradeDate: "2026-03-05",
        totalVolume: 100,
        openInterest: 2,
        activeContracts: 1,
        activeProducts: 1,
      },
      {
        tradeDate: "2026-03-12",
        totalVolume: 691,
        openInterest: 53,
        activeContracts: 2,
        activeProducts: 2,
      },
    ]);
    expect(snapshot.weeklyTrends).toEqual([
      {
        periodStart: "2026-03-02",
        periodEnd: "2026-03-05",
        totalVolume: 100,
        openInterest: 2,
        activeContracts: 1,
        activeProducts: 1,
      },
      {
        periodStart: "2026-03-09",
        periodEnd: "2026-03-12",
        totalVolume: 691,
        openInterest: 53,
        activeContracts: 2,
        activeProducts: 2,
      },
    ]);
    expect(snapshot.revenueModel.weeklyTrends).toEqual([
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
    ]);
  });

  it("falls back to the latest non-empty historical snapshot", async () => {
    const responses = new Map<string, unknown>([
      [
        "https://fixture.local/api/products",
        { success: true, data: ["GOM"] },
      ],
      [
        "https://fixture.local/api/instruments",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              market: "Energy",
              product: "GOM",
              symbol: "GOMK26",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/historical-data?asof=2026-03-13",
        { success: true, data: [] },
      ],
      [
        "https://fixture.local/api/historical-data?asof=2026-03-12",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              open_interest: "3",
              product: "GOM",
              settle: "12.50",
              settle_change: "-0.40",
              symbol: "GOMK26",
              total_volume: 636,
              trade_date: "2026-03-12",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/historical-data/time-series?from_date=2026-02-27&till_date=2026-03-12",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              open_interest: "2",
              product: "GOM",
              settle: "11.90",
              settle_change: "0.20",
              symbol: "GOMK26",
              total_volume: 100,
              trade_date: "2026-03-05",
            },
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              open_interest: "3",
              product: "GOM",
              settle: "12.50",
              settle_change: "-0.40",
              symbol: "GOMK26",
              total_volume: 636,
              trade_date: "2026-03-12",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/settlement-data?asof=2026-03-13",
        { success: true, data: [] },
      ],
      [
        "https://fixture.local/api/settlement-data?asof=2026-03-12",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              pre_settle: "12.10",
              product: "GOM",
              settle: "12.50",
              settle_change: "0.40",
              symbol: "GOMK26",
              trade_date: "2026-03-12",
            },
            {
              display_name: "GOMM26 (Jun)",
              expiry: "2026-05-01",
              pre_settle: "12.60",
              product: "GOM",
              settle: "13.20",
              settle_change: "0.60",
              symbol: "GOMM26",
              trade_date: "2026-03-12",
            },
          ],
        },
      ],
    ]);

    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      const payload = responses.get(url);
      if (!payload) {
        throw new Error(`Unexpected fetch: ${url}`);
      }

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const snapshot = await fetchDashboardSnapshot({
      baseUrl: "https://fixture.local/api",
      fetchImpl,
      now: new Date("2026-03-13T12:00:00Z"),
      trendLookbackDays: 14,
    });

    expect(snapshot.asOf).toBe("2026-03-12");
    expect(snapshot.settlementAsOf).toBe("2026-03-12");
    expect(snapshot.stats.totalVolume).toBe(636);
    expect(snapshot.stats.settledContracts).toBe(2);
    expect(snapshot.stats.modeledRevenue).toBe(6360);
    expect(snapshot.timeSeriesWindow).toEqual({
      fromDate: "2026-02-27",
      tillDate: "2026-03-12",
      lookbackDays: 14,
    });
    expect(snapshot.weeklyTrends.at(-1)).toMatchObject({
      periodStart: "2026-03-09",
      periodEnd: "2026-03-12",
      totalVolume: 636,
      openInterest: 3,
    });
    expect(snapshot.productDrilldowns[0]).toMatchObject({
      product: "GOM",
      latestEstimatedRevenue: 6360,
      curveSpread: 0.7,
    });
    expect(snapshot.productSummaries[0]).toMatchObject({
      product: "GOM",
      totalVolume: 636,
      openInterest: 3,
    });
    expect(snapshot.settlementSummaries[0]).toMatchObject({
      product: "GOM",
      pricedContracts: 2,
      curveSpread: 0.7,
    });
    expect(snapshot.revenueModel).toMatchObject({
      latestEstimatedRevenue: 6360,
      latestVolumeCoverage: 100,
      latestWeekRevenue: 6360,
      annualizedRunRate: 330720,
    });
  });

  it("chunks oversized historical time-series windows to stay within the api date-range limit", async () => {
    const responses = new Map<string, unknown>([
      [
        "https://fixture.local/api/products",
        { success: true, data: ["GOM"] },
      ],
      [
        "https://fixture.local/api/instruments",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              market: "Energy",
              product: "GOM",
              symbol: "GOMK26",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/historical-data?asof=2026-03-17",
        { success: true, data: [] },
      ],
      [
        "https://fixture.local/api/historical-data?asof=2026-03-16",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              open_interest: "3",
              product: "GOM",
              settle: "12.50",
              settle_change: "-0.40",
              symbol: "GOMK26",
              total_volume: 636,
              trade_date: "2026-03-16",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/historical-data/time-series?from_date=2025-03-15&till_date=2026-03-15",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              open_interest: "2",
              product: "GOM",
              settle: "11.90",
              settle_change: "0.20",
              symbol: "GOMK26",
              total_volume: 100,
              trade_date: "2025-03-17",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/historical-data/time-series?from_date=2026-03-16&till_date=2026-03-16",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              open_interest: "3",
              product: "GOM",
              settle: "12.50",
              settle_change: "-0.40",
              symbol: "GOMK26",
              total_volume: 636,
              trade_date: "2026-03-16",
            },
          ],
        },
      ],
      [
        "https://fixture.local/api/settlement-data?asof=2026-03-17",
        { success: true, data: [] },
      ],
      [
        "https://fixture.local/api/settlement-data?asof=2026-03-16",
        {
          success: true,
          data: [
            {
              display_name: "GOMK26 (May)",
              expiry: "2026-04-01",
              pre_settle: "12.10",
              product: "GOM",
              settle: "12.50",
              settle_change: "0.40",
              symbol: "GOMK26",
              trade_date: "2026-03-16",
            },
          ],
        },
      ],
    ]);

    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      const payload = responses.get(url);
      if (!payload) {
        throw new Error(`Unexpected fetch: ${url}`);
      }

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const snapshot = await fetchDashboardSnapshot({
      baseUrl: "https://fixture.local/api",
      fetchImpl,
      now: new Date("2026-03-17T12:00:00Z"),
      trendLookbackDays: 367,
    });

    expect(calls).toContain(
      "https://fixture.local/api/historical-data/time-series?from_date=2025-03-15&till_date=2026-03-15",
    );
    expect(calls).toContain(
      "https://fixture.local/api/historical-data/time-series?from_date=2026-03-16&till_date=2026-03-16",
    );
    expect(snapshot.timeSeries).toHaveLength(2);
    expect(snapshot.dailyTrends).toHaveLength(2);
    expect(snapshot.weeklyTrends).toHaveLength(2);
  });
});

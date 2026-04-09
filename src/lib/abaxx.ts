export const ABAXX_MARKET_DATA_BASE_URL = "https://abaxx.exchange/api";

export type ProductRecord = {
  id: string;
  label: string;
  raw: Record<string, unknown> | string;
};

export type InstrumentRecord = {
  symbol: string;
  label: string;
  product: string;
  expiry: string | null;
  market: string | null;
  raw: Record<string, unknown>;
};

export type HistoricalRecord = {
  symbol: string;
  label: string;
  product: string;
  expiry: string | null;
  tradeDate: string | null;
  settle: number | null;
  settleChange: number | null;
  totalVolume: number;
  openInterest: number;
  raw: Record<string, unknown>;
};

export type SettlementRecord = {
  symbol: string;
  label: string;
  product: string;
  expiry: string | null;
  tradeDate: string | null;
  preSettle: number | null;
  settle: number | null;
  settleChange: number | null;
  raw: Record<string, unknown>;
};

export type ProductSummary = {
  product: string;
  market: string | null;
  inCatalog: boolean;
  listedContracts: number;
  activeContracts: number;
  totalVolume: number;
  openInterest: number;
  frontSymbol: string | null;
  frontLabel: string | null;
  frontExpiry: string | null;
  frontSettle: number | null;
  frontSettleChange: number | null;
};

export type MarketSummary = {
  market: string;
  productCount: number;
  listedContracts: number;
  activeContracts: number;
  totalVolume: number;
  openInterest: number;
};

export type DailyTrendPoint = {
  tradeDate: string;
  totalVolume: number;
  openInterest: number;
  activeContracts: number;
  activeProducts: number;
};

export type WeeklyTrendPoint = {
  periodStart: string;
  periodEnd: string;
  totalVolume: number;
  openInterest: number;
  activeContracts: number;
  activeProducts: number;
};

export type SettlementSummary = {
  product: string;
  pricedContracts: number;
  tradeDate: string | null;
  frontSymbol: string | null;
  frontExpiry: string | null;
  frontSettle: number | null;
  frontSettleChange: number | null;
  backSymbol: string | null;
  backExpiry: string | null;
  backSettle: number | null;
  averageSettle: number | null;
  averageSettleChange: number | null;
  curveSpread: number | null;
  curveDirection: "contango" | "backwardation" | "flat" | "unclassified";
};

export type RevenueAssumption = {
  id: string;
  label: string;
  feePerSide: number;
  products: string[];
};

export type RevenueProductSummary = {
  product: string;
  assumptionId: string | null;
  pricingGroup: string | null;
  feePerSide: number | null;
  latestVolume: number;
  latestOpenInterest: number;
  latestEstimatedRevenue: number | null;
  revenueShare: number | null;
};

export type RevenueWeeklyAssumptionVolume = {
  assumptionId: string;
  label: string;
  volume: number;
  products: string[];
};

export type RevenueWeeklyTrendPoint = {
  periodStart: string;
  periodEnd: string;
  estimatedRevenue: number;
  pricedVolume: number;
  totalVolume: number;
  pricedProducts: number;
  assumptionVolumes: RevenueWeeklyAssumptionVolume[];
};

export type RevenueModel = {
  assumptions: RevenueAssumption[];
  latestEstimatedRevenue: number;
  latestModeledVolume: number;
  latestTotalVolume: number;
  latestVolumeCoverage: number | null;
  latestWeekRevenue: number;
  annualizedRunRate: number;
  quarterlyRunRate: number;
  pricedProducts: number;
  unpricedProducts: string[];
  productSummaries: RevenueProductSummary[];
  weeklyTrends: RevenueWeeklyTrendPoint[];
};

export type ProductContractDrilldown = {
  symbol: string;
  label: string;
  expiry: string | null;
  listed: boolean;
  active: boolean;
  hasSettlement: boolean;
  latestVolume: number;
  latestOpenInterest: number;
  snapshotSettle: number | null;
  snapshotSettleChange: number | null;
  settlementMark: number | null;
  settlementChange: number | null;
};

export type ProductDrilldownTrendPoint = {
  periodStart: string;
  periodEnd: string;
  totalVolume: number;
  openInterest: number;
  activeContracts: number;
  activeProducts: number;
  estimatedRevenue: number | null;
  pricedVolume: number;
};

export type ProductDrilldown = {
  product: string;
  market: string | null;
  inCatalog: boolean;
  listedContracts: number;
  activeContracts: number;
  pricedContracts: number;
  totalVolume: number;
  openInterest: number;
  frontSymbol: string | null;
  frontExpiry: string | null;
  frontSettle: number | null;
  frontSettleChange: number | null;
  curveSpread: number | null;
  curveDirection: SettlementSummary["curveDirection"];
  pricingGroup: string | null;
  feePerSide: number | null;
  latestEstimatedRevenue: number | null;
  revenueShare: number | null;
  contractDetails: ProductContractDrilldown[];
  dailyTrends: DailyTrendPoint[];
  weeklyTrends: ProductDrilldownTrendPoint[];
};

export type DashboardSnapshot = {
  asOf: string | null;
  products: ProductRecord[];
  instruments: InstrumentRecord[];
  historical: HistoricalRecord[];
  settlementAsOf: string | null;
  settlements: SettlementRecord[];
  timeSeries: HistoricalRecord[];
  productSummaries: ProductSummary[];
  marketSummaries: MarketSummary[];
  settlementSummaries: SettlementSummary[];
  productDrilldowns: ProductDrilldown[];
  revenueModel: RevenueModel;
  dailyTrends: DailyTrendPoint[];
  weeklyTrends: WeeklyTrendPoint[];
  timeSeriesWindow: {
    fromDate: string | null;
    tillDate: string | null;
    lookbackDays: number;
  };
  historyOnlyProducts: string[];
  stats: {
    catalogProducts: number;
    surfaceProducts: number;
    listedContracts: number;
    markets: number;
    activeContracts: number;
    activeProducts: number;
    settledContracts: number;
    settledProducts: number;
    totalVolume: number;
    openInterest: number;
    modeledRevenue: number;
  };
};

export const DEFAULT_REVENUE_ASSUMPTIONS: RevenueAssumption[] = [
  {
    id: "lng",
    label: "LNG",
    feePerSide: 5,
    products: ["GOM", "NPA", "NWE"],
  },
  {
    id: "carbon",
    label: "Carbon",
    feePerSide: 0.5,
    products: ["CP1", "RD1"],
  },
  {
    id: "battery-materials",
    label: "Battery Materials",
    feePerSide: 5,
    products: ["NSS", "LCS", "LCR", "LCB"],
  },
  {
    id: "precious-metals",
    label: "Precious Metals",
    feePerSide: 1.25,
    products: ["GKS", "GXS"],
  },
  {
    id: "weather",
    label: "Weather",
    feePerSide: 5,
    products: ["GWM", "UWM"],
  },
];

export function buildProductsUrl(baseUrl = ABAXX_MARKET_DATA_BASE_URL): string {
  return `${trimTrailingSlash(baseUrl)}/products`;
}

export function buildInstrumentsUrl(
  product?: string,
  baseUrl = ABAXX_MARKET_DATA_BASE_URL,
): string {
  const base = `${trimTrailingSlash(baseUrl)}/instruments`;
  if (!product) {
    return base;
  }

  const encodedProduct = encodeURIComponent(product);
  return `${base}?product=${encodedProduct}`;
}

export function buildHistoricalUrl(
  asOf: string,
  baseUrl = ABAXX_MARKET_DATA_BASE_URL,
): string {
  const encodedAsof = encodeURIComponent(asOf);
  return `${trimTrailingSlash(baseUrl)}/historical-data?asof=${encodedAsof}`;
}

export function buildSettlementUrl(
  asOf: string,
  baseUrl = ABAXX_MARKET_DATA_BASE_URL,
): string {
  const encodedAsof = encodeURIComponent(asOf);
  return `${trimTrailingSlash(baseUrl)}/settlement-data?asof=${encodedAsof}`;
}

export function buildHistoricalTimeSeriesUrl(
  fromDate: string,
  tillDate: string,
  options: {
    product?: string;
    instrument?: string;
    baseUrl?: string;
  } = {},
): string {
  const { product, instrument, baseUrl = ABAXX_MARKET_DATA_BASE_URL } = options;
  const params = new URLSearchParams();
  params.set("from_date", fromDate);
  params.set("till_date", tillDate);

  if (product) {
    params.set("product", product);
  }

  if (instrument) {
    params.set("instrument", instrument);
  }

  return `${trimTrailingSlash(baseUrl)}/historical-data/time-series?${params.toString()}`;
}

export function normalizeProducts(payload: unknown): ProductRecord[] {
  const items = unwrapCollection(payload);
  const normalized: Array<ProductRecord | null> = items.map((item) => {
    if (typeof item === "string" && item.trim()) {
      return {
        id: item,
        label: item,
        raw: item,
      };
    }

    const record = asRecord(item);
    if (!record) {
      return null;
    }

    const id = pickFirstString(record, [
      "id",
      "product",
      "productCode",
      "productId",
      "code",
      "symbol",
    ]);

    const label = pickFirstString(record, [
      "name",
      "productName",
      "displayName",
      "description",
      "productCode",
      "symbol",
      "id",
    ]);

    if (!id || !label) {
      return null;
    }

    return {
      id,
      label,
      raw: record,
    };
  });

  return normalized.filter((item): item is ProductRecord => item !== null);
}

export function normalizeInstruments(payload: unknown): InstrumentRecord[] {
  const items = unwrapCollection(payload);

  return items
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const symbol = pickFirstString(record, ["symbol"]);
      const label = pickFirstString(record, ["display_name", "symbol"]);
      const product = pickFirstString(record, ["product"]);
      const market = pickFirstString(record, ["market"]);

      if (!symbol || !label || !product) {
        return null;
      }

      return {
        symbol,
        label,
        product,
        expiry: pickFirstString(record, ["expiry"]),
        market,
        raw: record,
      };
    })
    .filter((item): item is InstrumentRecord => item !== null);
}

export function normalizeHistorical(payload: unknown): HistoricalRecord[] {
  const items = unwrapCollection(payload);

  return items
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const symbol = pickFirstString(record, ["symbol"]);
      const label = pickFirstString(record, ["display_name", "symbol"]);
      const product = pickFirstString(record, ["product"]);

      if (!symbol || !label || !product) {
        return null;
      }

      return {
        symbol,
        label,
        product,
        expiry: pickFirstString(record, ["expiry"]),
        tradeDate: pickFirstString(record, ["trade_date"]),
        settle: parseNumber(record.settle),
        settleChange: parseNumber(record.settle_change),
        totalVolume: parseNumber(record.total_volume) ?? 0,
        openInterest: parseNumber(record.open_interest) ?? 0,
        raw: record,
      };
    })
    .filter((item): item is HistoricalRecord => item !== null);
}

export function normalizeSettlement(payload: unknown): SettlementRecord[] {
  const items = unwrapCollection(payload);

  return items
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const symbol = pickFirstString(record, ["symbol"]);
      const label = pickFirstString(record, ["display_name", "symbol"]);
      const product = pickFirstString(record, ["product"]);

      if (!symbol || !label || !product) {
        return null;
      }

      return {
        symbol,
        label,
        product,
        expiry: pickFirstString(record, ["expiry"]),
        tradeDate: pickFirstString(record, ["trade_date"]),
        preSettle: parseNumber(record.pre_settle),
        settle: parseNumber(record.settle),
        settleChange: parseNumber(record.settle_change),
        raw: record,
      };
    })
    .filter((item): item is SettlementRecord => item !== null);
}

export async function fetchDashboardSnapshot(
  options: {
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    now?: Date;
    lookbackDays?: number;
    trendLookbackDays?: number;
  } = {},
): Promise<DashboardSnapshot> {
  const {
    baseUrl = resolveMarketDataBaseUrl(options.baseUrl),
    fetchImpl = fetch,
    now = resolveSnapshotNow(options.now),
    lookbackDays = 7,
    trendLookbackDays = 42,
  } = options;

  const [productsPayload, instrumentsPayload] = await Promise.all([
    fetchJson(buildProductsUrl(baseUrl), fetchImpl),
    fetchJson(buildInstrumentsUrl(undefined, baseUrl), fetchImpl),
  ]);

  const products = normalizeProducts(productsPayload);
  const instruments = normalizeInstruments(instrumentsPayload);

  const historicalSnapshot = await fetchLatestHistoricalSnapshot({
    baseUrl,
    fetchImpl,
    now,
    lookbackDays,
  });
  const settlementSnapshot = await fetchLatestSettlementSnapshot({
    baseUrl,
    fetchImpl,
    now,
    lookbackDays,
  });

  const timeSeriesWindow = buildTimeSeriesWindow(
    historicalSnapshot.asOf,
    trendLookbackDays,
  );
  const timeSeries = await fetchHistoricalTimeSeries({
    baseUrl,
    fetchImpl,
    timeSeriesWindow,
  });

  return buildDashboardSnapshot({
    asOf: historicalSnapshot.asOf,
    products,
    instruments,
    historical: historicalSnapshot.records,
    settlementAsOf: settlementSnapshot.asOf,
    settlements: settlementSnapshot.records,
    timeSeries,
    timeSeriesWindow,
  });
}

export function resolveMarketDataBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (typeof process !== "undefined") {
    const envValue = process.env.ABAXX_MARKET_DATA_BASE_URL;
    if (envValue && envValue.trim()) {
      return envValue.trim();
    }
  }

  return ABAXX_MARKET_DATA_BASE_URL;
}

export function resolveSnapshotNow(explicitNow?: Date): Date {
  if (explicitNow) {
    return explicitNow;
  }

  if (typeof process !== "undefined") {
    const envValue = process.env.ABAXX_SNAPSHOT_NOW;
    if (envValue) {
      const parsed = new Date(envValue);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return new Date();
}

export function buildDashboardSnapshot(input: {
  asOf: string | null;
  products: ProductRecord[];
  instruments: InstrumentRecord[];
  historical: HistoricalRecord[];
  settlementAsOf?: string | null;
  settlements?: SettlementRecord[];
  timeSeries?: HistoricalRecord[];
  timeSeriesWindow?: DashboardSnapshot["timeSeriesWindow"];
}): DashboardSnapshot {
  const {
    asOf,
    products,
    instruments,
    historical,
    settlementAsOf = asOf,
    settlements = [],
    timeSeries = [],
    timeSeriesWindow = {
      fromDate: null,
      tillDate: asOf,
      lookbackDays: 0,
    },
  } = input;
  const catalogProductIds = new Set(products.map((product) => product.id));
  const productIds = new Set<string>(catalogProductIds);

  for (const instrument of instruments) {
    productIds.add(instrument.product);
  }

  for (const row of historical) {
    productIds.add(row.product);
  }

  const productSummaries = [...productIds]
    .map((product) =>
      summarizeProduct({
        product,
        inCatalog: catalogProductIds.has(product),
        instruments: instruments.filter((instrument) => instrument.product === product),
        historical: historical.filter((row) => row.product === product),
      }),
    )
    .sort(compareProductSummaries);

  const historyOnlyProducts = productSummaries
    .filter((summary) => !summary.inCatalog)
    .map((summary) => summary.product);

  const marketSummaries = summarizeMarkets(productSummaries).sort(
    (left, right) =>
      right.totalVolume - left.totalVolume ||
      right.openInterest - left.openInterest ||
      left.market.localeCompare(right.market),
  );
  const settlementSummaries = summarizeSettlementCurves(settlements);
  const dailyTrends = summarizeDailyTrends(timeSeries);
  const weeklyTrends = summarizeWeeklyTrends(dailyTrends);
  const revenueModel = summarizeRevenueModel({
    historical,
    productSummaries,
    timeSeries,
  });
  const productDrilldowns = summarizeProductDrilldowns({
    productSummaries,
    instruments,
    historical,
    settlements,
    timeSeries,
    settlementSummaries,
    revenueModel,
  });
  const settledContracts = settlements.filter(
    (row) => row.settle !== null,
  ).length;
  const settledProducts = settlementSummaries.filter(
    (summary) => summary.pricedContracts > 0,
  ).length;

  return {
    asOf,
    products,
    instruments,
    historical,
    settlementAsOf,
    settlements,
    timeSeries,
    productSummaries,
    marketSummaries,
    settlementSummaries,
    productDrilldowns,
    revenueModel,
    dailyTrends,
    weeklyTrends,
    timeSeriesWindow,
    historyOnlyProducts,
    stats: {
      catalogProducts: products.length,
      surfaceProducts: productSummaries.length,
      listedContracts: instruments.length,
      markets: new Set(
        instruments
          .map((instrument) => instrument.market)
          .filter((market): market is string => Boolean(market)),
      ).size,
      activeContracts: historical.filter(isActiveHistoricalRow).length,
      activeProducts: productSummaries.filter((summary) => summary.activeContracts > 0).length,
      settledContracts,
      settledProducts,
      totalVolume: historical.reduce(
        (total, row) => total + row.totalVolume,
        0,
      ),
      openInterest: historical.reduce(
        (total, row) => total + row.openInterest,
        0,
      ),
      modeledRevenue: revenueModel.latestEstimatedRevenue,
    },
  };
}

export function unwrapCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  for (const key of ["data", "items", "results", "products"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

async function fetchLatestHistoricalSnapshot(options: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  now: Date;
  lookbackDays: number;
}): Promise<{ asOf: string | null; records: HistoricalRecord[] }> {
  const { baseUrl, fetchImpl, now, lookbackDays } = options;
  let fallbackDate: string | null = null;

  for (const asOf of buildRecentAsofDates(now, lookbackDays)) {
    fallbackDate = fallbackDate ?? asOf;
    const payload = await fetchJson(buildHistoricalUrl(asOf, baseUrl), fetchImpl);
    const records = normalizeHistorical(payload);

    if (records.length > 0) {
      return { asOf, records };
    }
  }

  return { asOf: fallbackDate, records: [] };
}

async function fetchLatestSettlementSnapshot(options: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  now: Date;
  lookbackDays: number;
}): Promise<{ asOf: string | null; records: SettlementRecord[] }> {
  const { baseUrl, fetchImpl, now, lookbackDays } = options;
  let fallbackDate: string | null = null;

  for (const asOf of buildRecentAsofDates(now, lookbackDays)) {
    fallbackDate = fallbackDate ?? asOf;
    const payload = await fetchJson(buildSettlementUrl(asOf, baseUrl), fetchImpl);
    const records = normalizeSettlement(payload);

    if (records.length > 0) {
      return { asOf, records };
    }
  }

  return { asOf: fallbackDate, records: [] };
}

async function fetchHistoricalTimeSeries(options: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  timeSeriesWindow: DashboardSnapshot["timeSeriesWindow"];
}): Promise<HistoricalRecord[]> {
  const { baseUrl, fetchImpl, timeSeriesWindow } = options;

  if (!timeSeriesWindow.fromDate || !timeSeriesWindow.tillDate) {
    return [];
  }

  try {
    const records: HistoricalRecord[] = [];

    for (const chunk of splitTimeSeriesWindow(timeSeriesWindow)) {
      const payload = await fetchJson(
        buildHistoricalTimeSeriesUrl(chunk.fromDate, chunk.tillDate, {
          baseUrl,
        }),
        fetchImpl,
      );
      records.push(...normalizeHistorical(payload));
    }

    return records;
  } catch (error) {
    console.error("Failed to fetch Abaxx historical time series:", error);
    return [];
  }
}

function buildRecentAsofDates(now: Date, lookbackDays: number): string[] {
  const anchor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  return Array.from({ length: lookbackDays }, (_, index) => {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() - index);
    return date.toISOString().slice(0, 10);
  });
}

function buildTimeSeriesWindow(
  asOf: string | null,
  lookbackDays: number,
): DashboardSnapshot["timeSeriesWindow"] {
  if (!asOf) {
    return {
      fromDate: null,
      tillDate: null,
      lookbackDays,
    };
  }

  const tillDate = parseIsoDate(asOf);
  if (!tillDate) {
    return {
      fromDate: null,
      tillDate: asOf,
      lookbackDays,
    };
  }

  const fromDate = new Date(tillDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - Math.max(lookbackDays - 1, 0));

  return {
    fromDate: fromDate.toISOString().slice(0, 10),
    tillDate: asOf,
    lookbackDays,
  };
}

function splitTimeSeriesWindow(
  timeSeriesWindow: DashboardSnapshot["timeSeriesWindow"],
  maxSpanDays = 366,
): Array<{
  fromDate: string;
  tillDate: string;
  lookbackDays: number;
}> {
  const { fromDate, tillDate } = timeSeriesWindow;
  if (!fromDate || !tillDate) {
    return [];
  }

  const from = parseIsoDate(fromDate);
  const till = parseIsoDate(tillDate);
  if (!from || !till || from > till) {
    return [
      {
        fromDate,
        tillDate,
        lookbackDays: timeSeriesWindow.lookbackDays,
      },
    ];
  }

  const windows: Array<{
    fromDate: string;
    tillDate: string;
    lookbackDays: number;
  }> = [];
  let cursor = new Date(from);

  while (cursor <= till) {
    const chunkStart = new Date(cursor);
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + maxSpanDays - 1);

    if (chunkEnd > till) {
      chunkEnd.setTime(till.getTime());
    }

    const lookbackDays =
      Math.ceil((chunkEnd.getTime() - chunkStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    windows.push({
      fromDate: chunkStart.toISOString().slice(0, 10),
      tillDate: chunkEnd.toISOString().slice(0, 10),
      lookbackDays,
    });

    cursor = new Date(chunkEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return windows;
}

async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: {
      accept: "application/json",
      "user-agent": "abaxx-dashboard/0.1",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }

  return response.json();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function pickFirstString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeProduct(input: {
  product: string;
  inCatalog: boolean;
  instruments: InstrumentRecord[];
  historical: HistoricalRecord[];
}): ProductSummary {
  const { product, inCatalog, instruments, historical } = input;
  const sortedInstruments = [...instruments].sort((left, right) =>
    compareIsoDates(left.expiry, right.expiry),
  );
  const sortedHistorical = [...historical].sort((left, right) =>
    compareIsoDates(left.expiry, right.expiry),
  );
  const frontHistorical = sortedHistorical[0] ?? null;
  const frontInstrument = sortedInstruments[0] ?? null;
  const market = sortedInstruments[0]?.market ?? null;

  return {
    product,
    market,
    inCatalog,
    listedContracts: instruments.length,
    activeContracts: historical.filter(isActiveHistoricalRow).length,
    totalVolume: historical.reduce((total, row) => total + row.totalVolume, 0),
    openInterest: historical.reduce((total, row) => total + row.openInterest, 0),
    frontSymbol: frontHistorical?.symbol ?? frontInstrument?.symbol ?? null,
    frontLabel: frontHistorical?.label ?? frontInstrument?.label ?? null,
    frontExpiry: frontHistorical?.expiry ?? frontInstrument?.expiry ?? null,
    frontSettle: frontHistorical?.settle ?? null,
    frontSettleChange: frontHistorical?.settleChange ?? null,
  };
}

function summarizeMarkets(productSummaries: ProductSummary[]): MarketSummary[] {
  const markets = new Map<string, MarketSummary & { products: Set<string> }>();

  for (const summary of productSummaries) {
    const market = summary.market ?? "Unassigned";
    const current = markets.get(market) ?? {
      market,
      productCount: 0,
      listedContracts: 0,
      activeContracts: 0,
      totalVolume: 0,
      openInterest: 0,
      products: new Set<string>(),
    };

    current.products.add(summary.product);
    current.listedContracts += summary.listedContracts;
    current.activeContracts += summary.activeContracts;
    current.totalVolume += summary.totalVolume;
    current.openInterest += summary.openInterest;
    markets.set(market, current);
  }

  return [...markets.values()].map((entry) => ({
    market: entry.market,
    productCount: entry.products.size,
    listedContracts: entry.listedContracts,
    activeContracts: entry.activeContracts,
    totalVolume: entry.totalVolume,
    openInterest: entry.openInterest,
  }));
}

function summarizeSettlementCurves(
  settlements: SettlementRecord[],
): SettlementSummary[] {
  const byProduct = new Map<string, SettlementRecord[]>();

  for (const row of settlements) {
    const current = byProduct.get(row.product) ?? [];
    current.push(row);
    byProduct.set(row.product, current);
  }

  return [...byProduct.entries()]
    .map(([product, rows]) => {
      const pricedRows = rows
        .filter((row) => row.settle !== null)
        .sort((left, right) => compareIsoDates(left.expiry, right.expiry));
      const front = pricedRows[0] ?? null;
      const back = pricedRows.at(-1) ?? null;
      const averageSettle = averageNumbers(
        pricedRows.map((row) => row.settle).filter((value): value is number => value !== null),
      );
      const averageSettleChange = averageNumbers(
        pricedRows
          .map((row) => row.settleChange)
          .filter((value): value is number => value !== null),
      );
      const curveSpread =
        front?.settle !== null && front?.settle !== undefined && back?.settle !== null && back?.settle !== undefined
          ? roundTo(back.settle - front.settle, 2)
          : null;

      return {
        product,
        pricedContracts: pricedRows.length,
        tradeDate: front?.tradeDate ?? rows[0]?.tradeDate ?? null,
        frontSymbol: front?.symbol ?? null,
        frontExpiry: front?.expiry ?? null,
        frontSettle: front?.settle ?? null,
        frontSettleChange: front?.settleChange ?? null,
        backSymbol: back?.symbol ?? null,
        backExpiry: back?.expiry ?? null,
        backSettle: back?.settle ?? null,
        averageSettle,
        averageSettleChange,
        curveSpread,
        curveDirection: classifyCurve(curveSpread),
      } satisfies SettlementSummary;
    })
    .sort(
      (left, right) =>
        right.pricedContracts - left.pricedContracts ||
        Math.abs(right.curveSpread ?? 0) - Math.abs(left.curveSpread ?? 0) ||
        left.product.localeCompare(right.product),
    );
}

function summarizeRevenueModel(input: {
  historical: HistoricalRecord[];
  productSummaries: ProductSummary[];
  timeSeries: HistoricalRecord[];
}): RevenueModel {
  const { historical, productSummaries, timeSeries } = input;
  const assumptionIndex = buildRevenueAssumptionIndex(DEFAULT_REVENUE_ASSUMPTIONS);
  const latestTotalVolume = historical.reduce((total, row) => total + row.totalVolume, 0);
  const latestModeledVolume = historical.reduce((total, row) => {
    const fee = assumptionIndex.get(row.product)?.feePerSide;
    return fee === undefined ? total : total + row.totalVolume;
  }, 0);
  const latestEstimatedRevenue = roundTo(
    historical.reduce((total, row) => {
      const fee = assumptionIndex.get(row.product)?.feePerSide;
      return fee === undefined ? total : total + estimateRevenue(row.totalVolume, fee);
    }, 0),
    2,
  );

  const revenueProductSummaries = productSummaries
    .map((summary) => {
      const assumption = assumptionIndex.get(summary.product) ?? null;
      const latestEstimatedProductRevenue =
        assumption === null
          ? null
          : roundTo(estimateRevenue(summary.totalVolume, assumption.feePerSide), 2);

      return {
        product: summary.product,
        assumptionId: assumption?.id ?? null,
        pricingGroup: assumption?.label ?? null,
        feePerSide: assumption?.feePerSide ?? null,
        latestVolume: summary.totalVolume,
        latestOpenInterest: summary.openInterest,
        latestEstimatedRevenue: latestEstimatedProductRevenue,
        revenueShare:
          latestEstimatedProductRevenue === null || latestEstimatedRevenue === 0
            ? null
            : roundTo((latestEstimatedProductRevenue / latestEstimatedRevenue) * 100, 2),
      } satisfies RevenueProductSummary;
    })
    .sort(
      (left, right) =>
        (right.latestEstimatedRevenue ?? -1) - (left.latestEstimatedRevenue ?? -1) ||
        right.latestVolume - left.latestVolume ||
        left.product.localeCompare(right.product),
    );

  const revenueDailyByDate = new Map<
    string,
    {
      tradeDate: string;
      estimatedRevenue: number;
      pricedVolume: number;
      totalVolume: number;
      pricedProducts: Set<string>;
    }
  >();

  for (const row of timeSeries) {
    if (!row.tradeDate) {
      continue;
    }

    const current = revenueDailyByDate.get(row.tradeDate) ?? {
      tradeDate: row.tradeDate,
      estimatedRevenue: 0,
      pricedVolume: 0,
      totalVolume: 0,
      pricedProducts: new Set<string>(),
    };
    const assumption = assumptionIndex.get(row.product);

    current.totalVolume += row.totalVolume;

    if (assumption) {
      current.pricedVolume += row.totalVolume;
      current.estimatedRevenue += estimateRevenue(row.totalVolume, assumption.feePerSide);
      if (row.totalVolume > 0) {
        current.pricedProducts.add(row.product);
      }
    }

    revenueDailyByDate.set(row.tradeDate, current);
  }

  const revenueWeeklyByPeriod = new Map<
    string,
    {
      periodStart: string;
      periodEnd: string;
      estimatedRevenue: number;
      pricedVolume: number;
      totalVolume: number;
      pricedProducts: Set<string>;
      assumptionVolumes: Map<
        string,
        {
          assumptionId: string;
          label: string;
          volume: number;
          products: Set<string>;
        }
      >;
    }
  >();

  for (const daily of revenueDailyByDate.values()) {
    const periodStart = startOfWeekUtc(daily.tradeDate);
    const current = revenueWeeklyByPeriod.get(periodStart) ?? {
      periodStart,
      periodEnd: daily.tradeDate,
      estimatedRevenue: 0,
      pricedVolume: 0,
      totalVolume: 0,
      pricedProducts: new Set<string>(),
      assumptionVolumes: new Map(),
    };

    current.periodEnd = daily.tradeDate;
    current.estimatedRevenue += daily.estimatedRevenue;
    current.pricedVolume += daily.pricedVolume;
    current.totalVolume += daily.totalVolume;

    for (const product of daily.pricedProducts) {
      current.pricedProducts.add(product);
    }

    for (const row of timeSeries) {
      if (row.tradeDate !== daily.tradeDate || row.totalVolume <= 0) {
        continue;
      }

      const assumption = assumptionIndex.get(row.product);
      if (!assumption) {
        continue;
      }

      const assumptionEntry = current.assumptionVolumes.get(assumption.id) ?? {
        assumptionId: assumption.id,
        label: assumption.label,
        volume: 0,
        products: new Set<string>(),
      };

      assumptionEntry.volume += row.totalVolume;
      assumptionEntry.products.add(row.product);
      current.assumptionVolumes.set(assumption.id, assumptionEntry);
    }

    revenueWeeklyByPeriod.set(periodStart, current);
  }

  const weeklyRevenueTrends = [...revenueWeeklyByPeriod.values()]
    .sort((left, right) => left.periodStart.localeCompare(right.periodStart))
    .map((entry) => ({
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      estimatedRevenue: roundTo(entry.estimatedRevenue, 2),
      pricedVolume: entry.pricedVolume,
      totalVolume: entry.totalVolume,
      pricedProducts: entry.pricedProducts.size,
      assumptionVolumes: [...entry.assumptionVolumes.values()]
        .map((volume) => ({
          assumptionId: volume.assumptionId,
          label: volume.label,
          volume: volume.volume,
          products: [...volume.products].sort(),
        }))
        .sort(
          (left, right) =>
            right.volume - left.volume || left.label.localeCompare(right.label),
        ),
    }));
  const latestWeekRevenue = weeklyRevenueTrends.at(-1)?.estimatedRevenue ?? 0;
  const unpricedProducts = productSummaries
    .filter((summary) => summary.totalVolume > 0 && !assumptionIndex.has(summary.product))
    .map((summary) => summary.product);

  return {
    assumptions: DEFAULT_REVENUE_ASSUMPTIONS,
    latestEstimatedRevenue,
    latestModeledVolume,
    latestTotalVolume,
    latestVolumeCoverage:
      latestTotalVolume > 0 ? roundTo((latestModeledVolume / latestTotalVolume) * 100, 2) : null,
    latestWeekRevenue: roundTo(latestWeekRevenue, 2),
    annualizedRunRate: roundTo(latestWeekRevenue * 52, 2),
    quarterlyRunRate: roundTo(latestWeekRevenue * 13, 2),
    pricedProducts: revenueProductSummaries.filter((summary) => summary.feePerSide !== null).length,
    unpricedProducts,
    productSummaries: revenueProductSummaries,
    weeklyTrends: weeklyRevenueTrends,
  };
}

function summarizeProductDrilldowns(input: {
  productSummaries: ProductSummary[];
  instruments: InstrumentRecord[];
  historical: HistoricalRecord[];
  settlements: SettlementRecord[];
  timeSeries: HistoricalRecord[];
  settlementSummaries: SettlementSummary[];
  revenueModel: RevenueModel;
}): ProductDrilldown[] {
  const {
    productSummaries,
    instruments,
    historical,
    settlements,
    timeSeries,
    settlementSummaries,
    revenueModel,
  } = input;
  const settlementSummaryByProduct = new Map(
    settlementSummaries.map((summary) => [summary.product, summary] as const),
  );
  const revenueSummaryByProduct = new Map(
    revenueModel.productSummaries.map((summary) => [summary.product, summary] as const),
  );

  return productSummaries.map((summary) => {
    const productInstruments = instruments.filter(
      (instrument) => instrument.product === summary.product,
    );
    const productHistorical = historical.filter((row) => row.product === summary.product);
    const productSettlements = settlements.filter((row) => row.product === summary.product);
    const productTimeSeries = timeSeries.filter((row) => row.product === summary.product);
    const settlementSummary = settlementSummaryByProduct.get(summary.product);
    const revenueSummary = revenueSummaryByProduct.get(summary.product);

    return {
      product: summary.product,
      market: summary.market,
      inCatalog: summary.inCatalog,
      listedContracts: summary.listedContracts,
      activeContracts: summary.activeContracts,
      pricedContracts: settlementSummary?.pricedContracts ?? 0,
      totalVolume: summary.totalVolume,
      openInterest: summary.openInterest,
      frontSymbol: summary.frontSymbol,
      frontExpiry: summary.frontExpiry,
      frontSettle: summary.frontSettle,
      frontSettleChange: summary.frontSettleChange,
      curveSpread: settlementSummary?.curveSpread ?? null,
      curveDirection: settlementSummary?.curveDirection ?? "unclassified",
      pricingGroup: revenueSummary?.pricingGroup ?? null,
      feePerSide: revenueSummary?.feePerSide ?? null,
      latestEstimatedRevenue: revenueSummary?.latestEstimatedRevenue ?? null,
      revenueShare: revenueSummary?.revenueShare ?? null,
      contractDetails: summarizeProductContractDetails({
        instruments: productInstruments,
        historical: productHistorical,
        settlements: productSettlements,
      }),
      dailyTrends: summarizeDailyTrends(productTimeSeries),
      weeklyTrends: summarizeProductWeeklyTrends(
        productTimeSeries,
        revenueSummary?.feePerSide ?? null,
      ),
    } satisfies ProductDrilldown;
  });
}

function summarizeProductContractDetails(input: {
  instruments: InstrumentRecord[];
  historical: HistoricalRecord[];
  settlements: SettlementRecord[];
}): ProductContractDrilldown[] {
  const { instruments, historical, settlements } = input;
  const symbols = new Set<string>();

  for (const instrument of instruments) {
    symbols.add(instrument.symbol);
  }

  for (const row of historical) {
    symbols.add(row.symbol);
  }

  for (const row of settlements) {
    symbols.add(row.symbol);
  }

  return [...symbols]
    .map((symbol) => {
      const instrument = instruments.find((row) => row.symbol === symbol) ?? null;
      const historyRows = historical.filter((row) => row.symbol === symbol);
      const settlementRows = settlements.filter((row) => row.symbol === symbol);
      const historicalRow = historyRows.sort((left, right) =>
        compareIsoDates(left.expiry, right.expiry),
      )[0] ?? null;
      const settlementRow = settlementRows.sort((left, right) =>
        compareIsoDates(left.expiry, right.expiry),
      )[0] ?? null;

      return {
        symbol,
        label:
          historicalRow?.label ??
          settlementRow?.label ??
          instrument?.label ??
          symbol,
        expiry:
          historicalRow?.expiry ??
          settlementRow?.expiry ??
          instrument?.expiry ??
          null,
        listed: instrument !== null,
        active: historyRows.some(isActiveHistoricalRow),
        hasSettlement: settlementRows.some((row) => row.settle !== null),
        latestVolume: historyRows.reduce((total, row) => total + row.totalVolume, 0),
        latestOpenInterest: historyRows.reduce(
          (total, row) => total + row.openInterest,
          0,
        ),
        snapshotSettle: historicalRow?.settle ?? null,
        snapshotSettleChange: historicalRow?.settleChange ?? null,
        settlementMark: settlementRow?.settle ?? null,
        settlementChange: settlementRow?.settleChange ?? null,
      } satisfies ProductContractDrilldown;
    })
    .sort(
      (left, right) =>
        compareIsoDates(left.expiry, right.expiry) ||
        right.latestVolume - left.latestVolume ||
        left.symbol.localeCompare(right.symbol),
    );
}

function summarizeProductWeeklyTrends(
  timeSeries: HistoricalRecord[],
  feePerSide: number | null,
): ProductDrilldownTrendPoint[] {
  const dailyTrends = summarizeDailyTrends(timeSeries);
  const weeklyTrends = summarizeWeeklyTrends(dailyTrends);
  const revenueByWeek = new Map<
    string,
    {
      estimatedRevenue: number;
      pricedVolume: number;
    }
  >();

  if (feePerSide !== null) {
    for (const row of timeSeries) {
      if (!row.tradeDate) {
        continue;
      }

      const periodStart = startOfWeekUtc(row.tradeDate);
      const current = revenueByWeek.get(periodStart) ?? {
        estimatedRevenue: 0,
        pricedVolume: 0,
      };

      current.estimatedRevenue += estimateRevenue(row.totalVolume, feePerSide);
      current.pricedVolume += row.totalVolume;
      revenueByWeek.set(periodStart, current);
    }
  }

  return weeklyTrends.map((trend) => {
    const revenue = revenueByWeek.get(trend.periodStart);

    return {
      ...trend,
      estimatedRevenue:
        feePerSide === null ? null : roundTo(revenue?.estimatedRevenue ?? 0, 2),
      pricedVolume: revenue?.pricedVolume ?? 0,
    } satisfies ProductDrilldownTrendPoint;
  });
}

function summarizeDailyTrends(timeSeries: HistoricalRecord[]): DailyTrendPoint[] {
  const byDate = new Map<
    string,
    {
      tradeDate: string;
      totalVolume: number;
      openInterest: number;
      activeContracts: number;
      activeProducts: Set<string>;
    }
  >();

  for (const row of timeSeries) {
    if (!row.tradeDate) {
      continue;
    }

    const current = byDate.get(row.tradeDate) ?? {
      tradeDate: row.tradeDate,
      totalVolume: 0,
      openInterest: 0,
      activeContracts: 0,
      activeProducts: new Set<string>(),
    };

    current.totalVolume += row.totalVolume;
    current.openInterest += row.openInterest;

    if (isActiveHistoricalRow(row)) {
      current.activeContracts += 1;
      current.activeProducts.add(row.product);
    }

    byDate.set(row.tradeDate, current);
  }

  return [...byDate.values()]
    .sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
    .map((entry) => ({
      tradeDate: entry.tradeDate,
      totalVolume: entry.totalVolume,
      openInterest: entry.openInterest,
      activeContracts: entry.activeContracts,
      activeProducts: entry.activeProducts.size,
    }));
}

function summarizeWeeklyTrends(dailyTrends: DailyTrendPoint[]): WeeklyTrendPoint[] {
  const byWeek = new Map<
    string,
    {
      periodStart: string;
      periodEnd: string;
      totalVolume: number;
      lastDaily: DailyTrendPoint;
    }
  >();

  for (const daily of dailyTrends) {
    const periodStart = startOfWeekUtc(daily.tradeDate);
    const current = byWeek.get(periodStart) ?? {
      periodStart,
      periodEnd: daily.tradeDate,
      totalVolume: 0,
      lastDaily: daily,
    };

    current.totalVolume += daily.totalVolume;
    current.periodEnd = daily.tradeDate;
    current.lastDaily = daily;
    byWeek.set(periodStart, current);
  }

  return [...byWeek.values()]
    .sort((left, right) => left.periodStart.localeCompare(right.periodStart))
    .map((entry) => ({
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      totalVolume: entry.totalVolume,
      openInterest: entry.lastDaily.openInterest,
      activeContracts: entry.lastDaily.activeContracts,
      activeProducts: entry.lastDaily.activeProducts,
    }));
}

function compareProductSummaries(left: ProductSummary, right: ProductSummary): number {
  return (
    right.totalVolume - left.totalVolume ||
    right.openInterest - left.openInterest ||
    right.listedContracts - left.listedContracts ||
    left.product.localeCompare(right.product)
  );
}

function compareIsoDates(left: string | null, right: string | null): number {
  if (left && right) {
    return left.localeCompare(right);
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
}

function parseIsoDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function averageNumbers(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return roundTo(
    values.reduce((total, value) => total + value, 0) / values.length,
    2,
  );
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildRevenueAssumptionIndex(
  assumptions: RevenueAssumption[],
): Map<string, RevenueAssumption> {
  const index = new Map<string, RevenueAssumption>();

  for (const assumption of assumptions) {
    for (const product of assumption.products) {
      index.set(product, assumption);
    }
  }

  return index;
}

function estimateRevenue(volume: number, feePerSide: number): number {
  return volume * feePerSide * 2;
}

function classifyCurve(
  curveSpread: number | null,
): SettlementSummary["curveDirection"] {
  if (curveSpread === null) {
    return "unclassified";
  }

  if (curveSpread > 0) {
    return "contango";
  }

  if (curveSpread < 0) {
    return "backwardation";
  }

  return "flat";
}

function startOfWeekUtc(value: string): string {
  const date = parseIsoDate(value);
  if (!date) {
    return value;
  }

  const day = date.getUTCDay();
  const offset = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function isActiveHistoricalRow(row: HistoricalRecord): boolean {
  return row.totalVolume > 0 || row.openInterest > 0;
}

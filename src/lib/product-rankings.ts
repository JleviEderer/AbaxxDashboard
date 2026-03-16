import type { DashboardSnapshot } from "@/lib/abaxx";

type ProductDrilldown = DashboardSnapshot["productDrilldowns"][number];

export type ProductRankingMode =
  | "absoluteVolume"
  | "absoluteOpenInterest"
  | "modeledFees"
  | "volumePerActiveContract"
  | "openInterestPerActiveContract"
  | "feesPerActiveContract";

export type ProductPricingFilter = "all" | "priced" | "unpriced";

export type ProductRankingModeDefinition = {
  id: ProductRankingMode;
  label: string;
  description: string;
  scoreLabel: string;
  normalized: boolean;
  valueKind: "integer" | "currency" | "decimal";
};

export type ProductRankingRow = {
  product: string;
  market: string | null;
  marketLabel: string;
  inCatalog: boolean;
  pricingGroup: string | null;
  pricingStatus: "priced" | "unpriced";
  listedContracts: number;
  activeContracts: number;
  pricedContracts: number;
  totalVolume: number;
  openInterest: number;
  latestEstimatedRevenue: number | null;
  revenueShare: number | null;
  frontSymbol: string | null;
  volumePerActiveContract: number | null;
  openInterestPerActiveContract: number | null;
  feesPerActiveContract: number | null;
  source: ProductDrilldown;
};

export const PRODUCT_RANKING_MODES: ProductRankingModeDefinition[] = [
  {
    id: "absoluteVolume",
    label: "Absolute volume",
    description: "Rank by the latest visible lots without normalization.",
    scoreLabel: "Latest volume",
    normalized: false,
    valueKind: "integer",
  },
  {
    id: "absoluteOpenInterest",
    label: "Open interest",
    description: "Rank by the latest snapshot open-interest stack.",
    scoreLabel: "Open interest",
    normalized: false,
    valueKind: "integer",
  },
  {
    id: "modeledFees",
    label: "Base modeled fees",
    description: "Rank by base fee contribution using the current pricing map.",
    scoreLabel: "Modeled daily fees",
    normalized: false,
    valueKind: "currency",
  },
  {
    id: "volumePerActiveContract",
    label: "Volume per active contract",
    description: "Normalize lots by active contract count so smaller products can surface.",
    scoreLabel: "Volume per active contract",
    normalized: true,
    valueKind: "decimal",
  },
  {
    id: "openInterestPerActiveContract",
    label: "OI per active contract",
    description: "Normalize open interest by active contract count.",
    scoreLabel: "Open interest per active contract",
    normalized: true,
    valueKind: "decimal",
  },
  {
    id: "feesPerActiveContract",
    label: "Fees per active contract",
    description: "Normalize base modeled fees by active contract count.",
    scoreLabel: "Modeled fees per active contract",
    normalized: true,
    valueKind: "currency",
  },
];

export function buildProductRankingRows(
  drilldowns: DashboardSnapshot["productDrilldowns"],
): ProductRankingRow[] {
  return drilldowns.map((drilldown) => ({
    product: drilldown.product,
    market: drilldown.market,
    marketLabel: drilldown.market ?? "Unassigned",
    inCatalog: drilldown.inCatalog,
    pricingGroup: drilldown.pricingGroup,
    pricingStatus: drilldown.latestEstimatedRevenue === null ? "unpriced" : "priced",
    listedContracts: drilldown.listedContracts,
    activeContracts: drilldown.activeContracts,
    pricedContracts: drilldown.pricedContracts,
    totalVolume: drilldown.totalVolume,
    openInterest: drilldown.openInterest,
    latestEstimatedRevenue: drilldown.latestEstimatedRevenue,
    revenueShare: drilldown.revenueShare,
    frontSymbol: drilldown.frontSymbol,
    volumePerActiveContract: safePerActive(
      drilldown.totalVolume,
      drilldown.activeContracts,
    ),
    openInterestPerActiveContract: safePerActive(
      drilldown.openInterest,
      drilldown.activeContracts,
    ),
    feesPerActiveContract:
      drilldown.latestEstimatedRevenue === null
        ? null
        : safePerActive(drilldown.latestEstimatedRevenue, drilldown.activeContracts),
    source: drilldown,
  }));
}

export function filterAndSortProductRankings(
  rows: ProductRankingRow[],
  options: {
    mode: ProductRankingMode;
    market?: string;
    pricing?: ProductPricingFilter;
  },
): ProductRankingRow[] {
  const { mode, market = "all", pricing = "all" } = options;

  return rows
    .filter((row) => {
      if (market !== "all" && row.marketLabel !== market) {
        return false;
      }

      if (pricing !== "all" && row.pricingStatus !== pricing) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        compareRankingValues(
          getProductRankingValue(right, mode),
          getProductRankingValue(left, mode),
        ) ||
        right.totalVolume - left.totalVolume ||
        right.openInterest - left.openInterest ||
        right.activeContracts - left.activeContracts ||
        left.product.localeCompare(right.product),
    );
}

export function getProductRankingValue(
  row: ProductRankingRow,
  mode: ProductRankingMode,
): number | null {
  switch (mode) {
    case "absoluteVolume":
      return row.totalVolume;
    case "absoluteOpenInterest":
      return row.openInterest;
    case "modeledFees":
      return row.latestEstimatedRevenue;
    case "volumePerActiveContract":
      return row.volumePerActiveContract;
    case "openInterestPerActiveContract":
      return row.openInterestPerActiveContract;
    case "feesPerActiveContract":
      return row.feesPerActiveContract;
    default:
      return row.totalVolume;
  }
}

function safePerActive(value: number, activeContracts: number): number | null {
  if (activeContracts <= 0) {
    return null;
  }

  return roundTo(value / activeContracts, 2);
}

function compareRankingValues(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

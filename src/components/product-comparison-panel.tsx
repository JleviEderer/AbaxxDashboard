"use client";

import type { DashboardSnapshot } from "@/lib/abaxx";

type ProductComparisonPanelProps = {
  drilldowns: DashboardSnapshot["productDrilldowns"];
  leftProduct: string;
  rightProduct: string;
  onLeftProductChange: (product: string) => void;
  onRightProductChange: (product: string) => void;
  embedded?: boolean;
};

const integerFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function ProductComparisonPanel({
  drilldowns,
  leftProduct,
  rightProduct,
  onLeftProductChange,
  onRightProductChange,
  embedded = false,
}: ProductComparisonPanelProps) {
  const left =
    drilldowns.find((item) => item.product === leftProduct) ?? drilldowns[0] ?? null;
  const right =
    drilldowns.find((item) => item.product === rightProduct) ??
    drilldowns.find((item) => item.product !== left?.product) ??
    drilldowns[0] ??
    null;

  const comparisons = !left || !right
    ? []
    : [
        {
          label: "Latest volume",
          leftValue: integerFormatter.format(left.totalVolume),
          rightValue: integerFormatter.format(right.totalVolume),
          leftRaw: left.totalVolume,
          rightRaw: right.totalVolume,
        },
        {
          label: "Open interest",
          leftValue: integerFormatter.format(left.openInterest),
          rightValue: integerFormatter.format(right.openInterest),
          leftRaw: left.openInterest,
          rightRaw: right.openInterest,
        },
        {
          label: "Listed contracts",
          leftValue: integerFormatter.format(left.listedContracts),
          rightValue: integerFormatter.format(right.listedContracts),
          leftRaw: left.listedContracts,
          rightRaw: right.listedContracts,
        },
        {
          label: "Active contracts",
          leftValue: integerFormatter.format(left.activeContracts),
          rightValue: integerFormatter.format(right.activeContracts),
          leftRaw: left.activeContracts,
          rightRaw: right.activeContracts,
        },
        {
          label: "Base modeled fees",
          leftValue:
            left.latestEstimatedRevenue === null
              ? "Unpriced"
              : formatCurrency(left.latestEstimatedRevenue),
          rightValue:
            right.latestEstimatedRevenue === null
              ? "Unpriced"
              : formatCurrency(right.latestEstimatedRevenue),
          leftRaw: left.latestEstimatedRevenue ?? -1,
          rightRaw: right.latestEstimatedRevenue ?? -1,
        },
        {
          label: "Curve spread",
          leftValue: formatSignedDecimal(left.curveSpread),
          rightValue: formatSignedDecimal(right.curveSpread),
          leftRaw: Math.abs(left.curveSpread ?? 0),
          rightRaw: Math.abs(right.curveSpread ?? 0),
        },
      ];

  const trendRows = !left || !right ? [] : buildTrendRows(left, right);
  const volumeMax = Math.max(
    ...trendRows.flatMap((row) => [
      row.leftTrend?.totalVolume ?? 0,
      row.rightTrend?.totalVolume ?? 0,
    ]),
    1,
  );

  if (!left || !right) {
    return null;
  }

  return (
    <section className={embedded ? "analysis-subpanel analysis-subpanel-comparison" : "dashboard-frame"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Product comparison</p>
          <h2>Put two products side by side before you infer the growth story.</h2>
        </div>
        <p className="section-copy">
          {embedded
            ? "Pressure-test the active read by comparing two products on volume, contract depth, fee contribution, and weekly shape."
            : "Drilldown depth is useful, but comparison is what turns that depth into a ranking tool. This panel compares activity, contract depth, base fee contribution, and recent weekly trend shape between any two products."}
        </p>
      </div>

      <div className="comparison-selector-toolbar">
        <label className="comparison-select-card">
          <span className="card-label">Left product</span>
          <select
            className="comparison-select"
            value={left.product}
            onChange={(event) => onLeftProductChange(event.currentTarget.value)}
          >
            {drilldowns.map((item) => (
              <option key={item.product} value={item.product}>
                {item.product} | {item.market ?? "Unassigned"}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="comparison-swap-button"
          onClick={() => {
            onLeftProductChange(right.product);
            onRightProductChange(left.product);
          }}
        >
          Swap sides
        </button>

        <label className="comparison-select-card">
          <span className="card-label">Right product</span>
          <select
            className="comparison-select"
            value={right.product}
            onChange={(event) => onRightProductChange(event.currentTarget.value)}
          >
            {drilldowns.map((item) => (
              <option key={item.product} value={item.product}>
                {item.product} | {item.market ?? "Unassigned"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="comparison-header-grid">
        <article className="comparison-hero comparison-hero-left">
          <p className="card-label">Left read</p>
          <strong>{left.product}</strong>
          <p>
            {left.market ?? "Unassigned"} market, front {left.frontSymbol ?? "n/a"}, curve{" "}
            {formatCurveHeadline(left)}.
          </p>
        </article>
        <article className="comparison-hero comparison-hero-right">
          <p className="card-label">Right read</p>
          <strong>{right.product}</strong>
          <p>
            {right.market ?? "Unassigned"} market, front {right.frontSymbol ?? "n/a"}, curve{" "}
            {formatCurveHeadline(right)}.
          </p>
        </article>
      </div>

      <div className="comparison-metric-grid">
        {comparisons.map((row) => {
          const leftLeading = row.leftRaw > row.rightRaw;
          const rightLeading = row.rightRaw > row.leftRaw;

          return (
            <article key={row.label} className="comparison-metric-card">
              <p className="card-label">{row.label}</p>
              <div className="comparison-metric-row">
                <div className={leftLeading ? "comparison-side comparison-side-leading" : "comparison-side"}>
                  <strong>{row.leftValue}</strong>
                  <span>{left.product}</span>
                </div>
                <div className="comparison-divider">vs</div>
                <div className={rightLeading ? "comparison-side comparison-side-leading" : "comparison-side"}>
                  <strong>{row.rightValue}</strong>
                  <span>{right.product}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="slice-grid comparison-detail-grid">
        <article className="slice-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Weekly match-up</p>
              <h3>{left.product} vs {right.product}</h3>
            </div>
            <p className="panel-meta">
              Latest six visible weekly buckets using the current public time-series window
            </p>
          </div>

          <div className="activity-chart" role="img" aria-label={`${left.product} versus ${right.product} weekly volume comparison`}>
            {trendRows.map((row) => (
              <div key={row.periodStart} className="comparison-trend-row">
                <div className="activity-labels">
                  <strong>{formatDateRange(row.periodStart, row.periodEnd)}</strong>
                  <span>
                    {left.product} {integerFormatter.format(row.leftTrend?.openInterest ?? 0)} OI /{" "}
                    {right.product} {integerFormatter.format(row.rightTrend?.openInterest ?? 0)} OI
                  </span>
                </div>
                <div className="comparison-trend-bars">
                  <div className="comparison-trend-bar">
                    <span>{left.product}</span>
                    <div className="activity-bar-shell">
                      <div
                        className="activity-bar-fill"
                        style={{
                          width: `${Math.max(
                            ((row.leftTrend?.totalVolume ?? 0) / volumeMax) * 100,
                            (row.leftTrend?.totalVolume ?? 0) > 0 ? 7 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="comparison-trend-bar">
                    <span>{right.product}</span>
                    <div className="activity-bar-shell">
                      <div
                        className="activity-bar-fill activity-bar-fill-secondary"
                        style={{
                          width: `${Math.max(
                            ((row.rightTrend?.totalVolume ?? 0) / volumeMax) * 100,
                            (row.rightTrend?.totalVolume ?? 0) > 0 ? 7 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="activity-detail">
                  {integerFormatter.format(row.leftTrend?.totalVolume ?? 0)} vs{" "}
                  {integerFormatter.format(row.rightTrend?.totalVolume ?? 0)} vol
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="slice-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Contract overlap</p>
              <h3>Front tenor and ladder context</h3>
            </div>
            <p className="panel-meta">Side-by-side base model and current contract-ladder depth</p>
          </div>

          <div className="comparison-contract-grid">
            {[left, right].map((item) => (
              <div key={item.product} className="comparison-contract-card">
                <div className="product-cell">
                  <strong>{item.product}</strong>
                  <span>
                    {item.frontSymbol ?? "n/a"} | {formatDate(item.frontExpiry)}
                  </span>
                </div>
                <div className="comparison-contract-stats">
                  <span>{integerFormatter.format(item.contractDetails.length)} visible contracts</span>
                  <span>{integerFormatter.format(item.pricedContracts)} marked tenors</span>
                  <span>
                    {item.latestEstimatedRevenue === null
                      ? "Base model unpriced"
                      : `${formatCurrency(item.latestEstimatedRevenue)} base fees`}
                  </span>
                  <span>{formatPercent(item.revenueShare)} of base modeled fees</span>
                </div>
                <div className="comparison-mini-ladder">
                  {item.contractDetails.slice(0, 4).map((contract) => (
                    <div key={contract.symbol} className="comparison-mini-row">
                      <strong>{contract.symbol}</strong>
                      <span>{integerFormatter.format(contract.latestVolume)} vol</span>
                      <span>{formatSignedPrice(contract.settlementMark, contract.settlementChange)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function buildTrendRows(
  left: DashboardSnapshot["productDrilldowns"][number],
  right: DashboardSnapshot["productDrilldowns"][number],
) {
  const map = new Map<
    string,
    {
      periodStart: string;
      periodEnd: string;
      leftTrend: (typeof left.weeklyTrends)[number] | null;
      rightTrend: (typeof right.weeklyTrends)[number] | null;
    }
  >();

  for (const trend of left.weeklyTrends.slice(-6)) {
    map.set(trend.periodStart, {
      periodStart: trend.periodStart,
      periodEnd: trend.periodEnd,
      leftTrend: trend,
      rightTrend: null,
    });
  }

  for (const trend of right.weeklyTrends.slice(-6)) {
    const current = map.get(trend.periodStart) ?? {
      periodStart: trend.periodStart,
      periodEnd: trend.periodEnd,
      leftTrend: null,
      rightTrend: null,
    };
    current.periodEnd = current.leftTrend?.periodEnd ?? trend.periodEnd;
    current.rightTrend = trend;
    map.set(trend.periodStart, current);
  }

  return [...map.values()]
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
    .slice(-6);
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${percentFormatter.format(value)}%`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "n/a";
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatDateRange(start: string, end: string): string {
  if (start === end) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatSignedDecimal(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  if (value === 0) {
    return "0.00";
  }

  return `${value > 0 ? "+" : ""}${decimalFormatter.format(value)}`;
}

function formatSignedPrice(price: number | null, change: number | null): string {
  if (price === null) {
    return "n/a";
  }

  return `${decimalFormatter.format(price)} (${formatSignedDecimal(change)})`;
}

function formatCurveHeadline(
  drilldown: DashboardSnapshot["productDrilldowns"][number],
): string {
  if (drilldown.curveSpread === null) {
    return "single mark";
  }

  return `${drilldown.curveDirection} ${formatSignedDecimal(drilldown.curveSpread)}`;
}

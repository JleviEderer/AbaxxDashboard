"use client";

import type { DashboardSnapshot } from "@/lib/abaxx";

type ProductDrilldownPanelProps = {
  drilldowns: DashboardSnapshot["productDrilldowns"];
  snapshotAsOf: string | null;
  settlementAsOf: string | null;
  selectedProduct: string;
  onSelectProduct: (product: string) => void;
  embedded?: boolean;
};

const integerFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function ProductDrilldownPanel({
  drilldowns,
  snapshotAsOf,
  settlementAsOf,
  selectedProduct,
  onSelectProduct,
  embedded = false,
}: ProductDrilldownPanelProps) {
  if (drilldowns.length === 0) {
    return null;
  }

  const selected =
    drilldowns.find((item) => item.product === selectedProduct) ?? drilldowns[0];
  const recentTrends = selected.weeklyTrends.slice(-6);
  const trendVolumeMax = Math.max(...recentTrends.map((trend) => trend.totalVolume), 1);
  const trendOiMax = Math.max(...recentTrends.map((trend) => trend.openInterest), 1);

  return (
    <section className={embedded ? "analysis-subpanel analysis-subpanel-drilldown" : "dashboard-frame"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Product drilldown</p>
          <h2>Go from market-level summary to one product&apos;s contract stack.</h2>
        </div>
        <p className="section-copy">
          {embedded
            ? "Stay on one product long enough to connect the current snapshot, weekly trend, fee assumptions, and visible tenor ladder."
            : "The next useful depth layer is not more top-line charts. It is a product-first view that ties the current snapshot, weekly activity, fee assumptions, and settlement curve into one place."}
        </p>
      </div>

      <div className="product-drilldown-layout">
        <div className="product-chip-grid" role="tablist" aria-label="Select a product">
          {drilldowns.map((item) => (
            <button
              key={item.product}
              type="button"
              className={
                item.product === selected.product
                  ? "product-chip product-chip-active"
                  : "product-chip"
              }
              onClick={() => onSelectProduct(item.product)}
              aria-pressed={item.product === selected.product}
            >
              <span className="product-chip-header">
                <strong>{item.product}</strong>
                <span>{item.market ?? "Unassigned"}</span>
              </span>
              <span className="product-chip-meta">
                <span>{integerFormatter.format(item.totalVolume)} vol</span>
                <span>{integerFormatter.format(item.openInterest)} OI</span>
                <span>
                  {item.latestEstimatedRevenue === null
                    ? "unpriced"
                    : formatCurrency(item.latestEstimatedRevenue)}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="product-drilldown-body">
          <div className="trend-stat-grid product-drilldown-kpis">
            <article className="trend-stat-card">
              <p className="card-label">Snapshot read</p>
              <strong>{integerFormatter.format(selected.totalVolume)}</strong>
              <p>
                Latest volume and {integerFormatter.format(selected.openInterest)} open
                interest on {formatDate(snapshotAsOf)}.
              </p>
            </article>
            <article className="trend-stat-card">
              <p className="card-label">Base modeled fees</p>
              <strong>
                {selected.latestEstimatedRevenue === null
                  ? "Unpriced"
                  : formatCurrency(selected.latestEstimatedRevenue)}
              </strong>
              <p>
                {selected.feePerSide === null
                  ? "No explicit fee assumption is mapped to this product yet."
                  : `${selected.pricingGroup ?? "Modeled"} at ${formatCurrency(selected.feePerSide)} per side before scenario overrides.`}
              </p>
            </article>
            <article className="trend-stat-card">
              <p className="card-label">Curve state</p>
              <strong>{formatCurveHeadline(selected)}</strong>
              <p>
                {selected.pricedContracts > 0
                  ? `${integerFormatter.format(selected.pricedContracts)} priced contracts in settlement-data as of ${formatDate(settlementAsOf)}.`
                  : "No visible multi-contract settlement curve in the current run."}
              </p>
            </article>
            <article className="trend-stat-card">
              <p className="card-label">Contract depth</p>
              <strong>{integerFormatter.format(selected.contractDetails.length)}</strong>
              <p>
                {integerFormatter.format(selected.listedContracts)} listed /{" "}
                {integerFormatter.format(selected.activeContracts)} active /{" "}
                {formatPercent(selected.revenueShare)} of modeled daily fees.
              </p>
            </article>
          </div>

          <div className="slice-grid product-drilldown-grid">
            <article className="slice-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Trend focus</p>
                  <h3>{selected.product} weekly activity</h3>
                </div>
                <p className="panel-meta">
                  Front contract {selected.frontSymbol ?? "n/a"} expiring{" "}
                  {formatDate(selected.frontExpiry)}
                </p>
              </div>

              {recentTrends.length > 0 ? (
                <div className="activity-chart" role="img" aria-label={`${selected.product} weekly activity`}>
                  {recentTrends.map((trend) => (
                    <div key={trend.periodStart} className="activity-row activity-row-stack">
                      <div className="activity-labels">
                        <strong>{formatDateRange(trend.periodStart, trend.periodEnd)}</strong>
                        <span>
                          {integerFormatter.format(trend.activeContracts)} active contracts /{" "}
                          {integerFormatter.format(trend.openInterest)} week-end OI
                        </span>
                      </div>
                      <div className="product-trend-bars">
                        <div className="activity-bar-shell">
                          <div
                            className="activity-bar-fill"
                            style={{
                              width: `${Math.max(
                                (trend.totalVolume / trendVolumeMax) * 100,
                                trend.totalVolume > 0 ? 7 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="activity-bar-shell">
                          <div
                            className="activity-bar-fill activity-bar-fill-secondary"
                            style={{
                              width: `${Math.max(
                                (trend.openInterest / trendOiMax) * 100,
                                trend.openInterest > 0 ? 7 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="activity-detail">
                        {integerFormatter.format(trend.totalVolume)} vol /{" "}
                        {trend.estimatedRevenue === null
                          ? "unpriced"
                          : formatCurrency(trend.estimatedRevenue)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-note">
                  <p>No recent time-series rows were available for this product.</p>
                </div>
              )}
            </article>

            <article className="slice-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Contract ladder</p>
                  <h3>Where the visible curve actually sits</h3>
                </div>
                <p className="panel-meta">
                  Snapshot settle vs settlement mark for each visible tenor
                </p>
              </div>

              <div className="contract-ladder">
                {selected.contractDetails.map((contract) => (
                  <div key={contract.symbol} className="contract-row">
                    <div className="contract-main">
                      <div className="product-cell">
                        <strong>{contract.symbol}</strong>
                        <span>{formatDate(contract.expiry)}</span>
                      </div>
                      <div className="contract-status">
                        <span className="contract-pill">
                          {contract.listed ? "Listed" : "Off-catalog"}
                        </span>
                        <span className="contract-pill">
                          {contract.active ? "Active" : "Idle"}
                        </span>
                        <span className="contract-pill">
                          {contract.hasSettlement ? "Marked" : "Unmarked"}
                        </span>
                      </div>
                    </div>
                    <div className="contract-metrics">
                      <span>{integerFormatter.format(contract.latestVolume)} vol</span>
                      <span>{integerFormatter.format(contract.latestOpenInterest)} OI</span>
                      <span>
                        Snap {formatSignedPrice(contract.snapshotSettle, contract.snapshotSettleChange)}
                      </span>
                      <span>
                        Settle {formatSignedPrice(contract.settlementMark, contract.settlementChange)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="surface-note">
            <p>
              Investor read: {selected.product} currently sits in{" "}
              {selected.market ?? "an unassigned market"} with{" "}
              {integerFormatter.format(selected.listedContracts)} listed contracts,
              {selected.frontSymbol ? ` fronted by ${selected.frontSymbol}` : " no visible front contract"}, and{" "}
              {selected.curveSpread === null
                ? "no visible multi-tenor spread yet."
                : `${selected.curveDirection} spread of ${formatSignedDecimal(selected.curveSpread)}.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
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

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${percentFormatter.format(value)}%`;
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
    return "Single mark";
  }

  return `${capitalize(drilldown.curveDirection)} ${formatSignedDecimal(drilldown.curveSpread)}`;
}

function capitalize(value: string): string {
  return value ? `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}` : value;
}

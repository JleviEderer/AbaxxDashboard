"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LineChartCard } from "@/components/line-chart-card";
import { ProductAnalysisWorkbench } from "@/components/product-analysis-workbench";
import { RevenueScenarioPanel } from "@/components/revenue-scenario-panel";
import type { DashboardSnapshot } from "@/lib/abaxx";

type DashboardWorkspaceProps = {
  snapshot: DashboardSnapshot;
  requestedAsOf: string;
  requestedWindowDays: number;
  asOfOptions: string[];
  windowOptions: number[];
};

type WorkspaceTab = "market" | "workflow" | "revenue";
type ChartMetric = "volume" | "openInterest" | "fees";

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
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const WORKSPACE_TABS = [
  ["market", "Market", "Chart-first activity, settlement, and movers."],
  ["workflow", "Workflow", "Rank, inspect, and compare products in one loop."],
  ["revenue", "Revenue", "Stress the fee model without changing observed flow."],
] as const satisfies ReadonlyArray<readonly [WorkspaceTab, string, string]>;

const CHART_METRICS = [
  ["volume", "Weekly volume", "Volume"],
  ["openInterest", "Week-end open interest", "OI"],
  ["fees", "Modeled weekly fees", "Fees"],
] as const satisfies ReadonlyArray<readonly [ChartMetric, string, string]>;

export function DashboardWorkspace({
  snapshot,
  requestedAsOf,
  requestedWindowDays,
  asOfOptions,
  windowOptions,
}: DashboardWorkspaceProps) {
  const defaultSelected =
    snapshot.productDrilldowns.find(
      (item) => item.totalVolume > 0 || item.openInterest > 0,
    )?.product ??
    snapshot.productDrilldowns[0]?.product ??
    "";
  const defaultCompare =
    snapshot.productDrilldowns.find((item) => item.product !== defaultSelected)?.product ??
    defaultSelected;

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("market");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("volume");
  const [marketFilter, setMarketFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(defaultSelected);
  const [leftProduct, setLeftProduct] = useState(defaultSelected);
  const [rightProduct, setRightProduct] = useState(defaultCompare);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const marketOptions = [
    ...new Set(
      snapshot.productDrilldowns.map((item) => item.market ?? "Unassigned"),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const filteredDrilldowns = snapshot.productDrilldowns.filter(
    (item) =>
      marketFilter === "all" || (item.market ?? "Unassigned") === marketFilter,
  );
  const activeDrilldowns =
    filteredDrilldowns.length > 0 ? filteredDrilldowns : snapshot.productDrilldowns;

  if (activeDrilldowns.length === 0) {
    return null;
  }

  const resolvedSelected =
    resolveProduct(activeDrilldowns, selectedProduct) ?? activeDrilldowns[0]?.product ?? "";
  const resolvedLeft =
    resolveProduct(activeDrilldowns, leftProduct) ?? resolvedSelected;
  const resolvedRight =
    resolveProduct(activeDrilldowns, rightProduct) ??
    activeDrilldowns.find((item) => item.product !== resolvedLeft)?.product ??
    resolvedLeft;

  const left =
    activeDrilldowns.find((item) => item.product === resolvedLeft) ??
    activeDrilldowns[0];
  const right =
    activeDrilldowns.find((item) => item.product === resolvedRight) ??
    activeDrilldowns.find((item) => item.product !== left.product) ??
    left;

  const overlayRows = buildOverlayRows(left, right, chartMetric);
  const watchlist = [...activeDrilldowns]
    .sort(
      (leftItem, rightItem) =>
        rightItem.totalVolume - leftItem.totalVolume ||
        rightItem.openInterest - leftItem.openInterest ||
        leftItem.product.localeCompare(rightItem.product),
    )
    .slice(0, 6);
  const settlementMovers = snapshot.settlementSummaries
    .filter((item) =>
      activeDrilldowns.some((drilldown) => drilldown.product === item.product),
    )
    .filter((item) => item.frontSettle !== null)
    .sort(
      (leftItem, rightItem) =>
        Math.abs(rightItem.frontSettleChange ?? 0) -
          Math.abs(leftItem.frontSettleChange ?? 0) ||
        rightItem.pricedContracts - leftItem.pricedContracts ||
        leftItem.product.localeCompare(rightItem.product),
    )
    .slice(0, 4);
  const revenueLeaders = snapshot.revenueModel.productSummaries
    .filter(
      (item) =>
        item.latestEstimatedRevenue !== null &&
        activeDrilldowns.some((drilldown) => drilldown.product === item.product),
    )
    .slice(0, 4);
  const timeWindowLabel = formatWindow(
    snapshot.timeSeriesWindow.fromDate,
    snapshot.timeSeriesWindow.tillDate,
  );
  const snapshotStatusLabel =
    snapshot.asOf === requestedAsOf && snapshot.settlementAsOf === requestedAsOf
      ? `Requested ${formatDate(requestedAsOf)}. Activity and settlement both resolved on the same date.`
      : `Requested ${formatDate(requestedAsOf)}. Activity resolved to ${formatDate(snapshot.asOf)} and settlement resolved to ${formatDate(snapshot.settlementAsOf)}.`;
  const activeMetric = CHART_METRICS.find((item) => item[0] === chartMetric) ?? CHART_METRICS[0];
  const latestRow = overlayRows.at(-1);
  const priorRow = overlayRows.at(-2);
  const listedContracts = activeDrilldowns.reduce(
    (total, item) => total + item.listedContracts,
    0,
  );
  const totalVolume = activeDrilldowns.reduce(
    (total, item) => total + item.totalVolume,
    0,
  );
  const openInterest = activeDrilldowns.reduce(
    (total, item) => total + item.openInterest,
    0,
  );
  const modeledFees = activeDrilldowns.reduce(
    (total, item) => total + (item.latestEstimatedRevenue ?? 0),
    0,
  );
  const markedProducts = activeDrilldowns.filter((item) => item.pricedContracts > 0).length;

  const navigateWithQuery = (updates: Record<string, string>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      nextParams.set(key, value);
    }

    const nextQuery = nextParams.toString();
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <>
      <header className="workspace-command-bar">
        <div className="command-cluster command-cluster-tabs">
          <div className="workspace-segmented" aria-label="Workspace tabs" role="tablist">
            {WORKSPACE_TABS.map(([id, label, detail]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={
                  activeTab === id
                    ? "workspace-segment workspace-segment-active"
                    : "workspace-segment"
                }
                onClick={() => setActiveTab(id)}
              >
                <span>{label}</span>
                <small>{detail}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="command-cluster">
          <label className="command-field">
            <span className="command-label">As of</span>
            <select
              className="workspace-select"
              aria-label="As of"
              value={requestedAsOf}
              disabled={isPending}
              onChange={(event) =>
                navigateWithQuery({ asof: event.currentTarget.value })
              }
            >
              {asOfOptions.map((option) => (
                <option key={option} value={option}>
                  {formatDate(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="command-field">
            <span className="command-label">Window</span>
            <select
              className="workspace-select"
              aria-label="Time window"
              value={String(requestedWindowDays)}
              disabled={isPending}
              onChange={(event) =>
                navigateWithQuery({ window: event.currentTarget.value })
              }
            >
              {windowOptions.map((days) => (
                <option key={days} value={days}>
                  {formatWindowOption(days)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="command-cluster command-cluster-controls">
          <label className="command-field">
            <span className="command-label">Market</span>
            <select
              className="workspace-select"
              aria-label="Market"
              value={marketFilter}
              onChange={(event) => setMarketFilter(event.currentTarget.value)}
            >
              <option value="all">All markets</option>
              {marketOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="command-field">
            <span className="command-label">Focus</span>
            <select
              className="workspace-select"
              aria-label="Focus product"
              value={resolvedSelected}
              onChange={(event) => {
                const nextProduct = event.currentTarget.value;
                setSelectedProduct(nextProduct);
                setLeftProduct(nextProduct);
              }}
            >
              {activeDrilldowns.map((item) => (
                <option key={item.product} value={item.product}>
                  {item.product} | {item.market ?? "Unassigned"}
                </option>
              ))}
            </select>
          </label>

          <label className="command-field">
            <span className="command-label">Compare</span>
            <select
              className="workspace-select"
              aria-label="Compare product"
              value={resolvedRight}
              onChange={(event) => setRightProduct(event.currentTarget.value)}
            >
              {activeDrilldowns.map((item) => (
                <option key={item.product} value={item.product}>
                  {item.product} | {item.market ?? "Unassigned"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="command-cluster command-cluster-actions">
          <div className="workspace-pill-group" aria-label="Chart metric">
            {CHART_METRICS.map(([id, , shortLabel]) => (
              <button
                key={id}
                type="button"
                className={
                  chartMetric === id
                    ? "workspace-pill workspace-pill-active"
                    : "workspace-pill"
                }
                onClick={() => setChartMetric(id)}
              >
                {shortLabel}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="workspace-action-button workspace-action-button-secondary"
            onClick={() => {
              setActiveTab("market");
              setChartMetric("volume");
              setMarketFilter("all");
              setSelectedProduct(defaultSelected);
              setLeftProduct(defaultSelected);
              setRightProduct(defaultCompare);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="workspace-action-button"
            onClick={() => window.print()}
          >
            Export
          </button>
        </div>
      </header>

      <section className="workspace-kpi-strip" aria-label="KPI strip">
        <article className="workspace-kpi-card workspace-kpi-card-accent">
          <p className="card-label">Products in view</p>
          <strong>{integerFormatter.format(activeDrilldowns.length)}</strong>
          <p>
            {marketFilter === "all"
              ? "Full exchange surface."
              : `${marketFilter} scoped workspace.`}
          </p>
        </article>
        <article className="workspace-kpi-card">
          <p className="card-label">Listed contracts</p>
          <strong>{integerFormatter.format(listedContracts)}</strong>
          <p>{integerFormatter.format(markedProducts)} products currently have visible marks.</p>
        </article>
        <article className="workspace-kpi-card">
          <p className="card-label">Latest volume</p>
          <strong>{integerFormatter.format(totalVolume)}</strong>
          <p>{integerFormatter.format(openInterest)} open interest in the same scope.</p>
        </article>
        <article className="workspace-kpi-card">
          <p className="card-label">Modeled daily fees</p>
          <strong>{currencyFormatter.format(modeledFees)}</strong>
          <p>Observed flow fixed, fee layer still scenario-aware.</p>
        </article>
      </section>

      <section className="workspace-stage-grid">
        <article className="workspace-panel workspace-panel-stage">
          <div className="workspace-panel-header">
            <div>
              <p className="eyebrow">Abaxx market workspace</p>
              <h1>Weekly {activeMetric[2].toLowerCase()} overlay</h1>
            </div>
            <p className="workspace-panel-meta">
              {snapshotStatusLabel} Trend window: {timeWindowLabel}
            </p>
          </div>

          <div className="workspace-stage-summary">
            <article className="workspace-stage-card">
              <p className="card-label">Focus leg</p>
              <strong>{left.product}</strong>
              <p>
                {left.market ?? "Unassigned"} market, front {left.frontSymbol ?? "n/a"}.
              </p>
            </article>
            <article className="workspace-stage-card">
              <p className="card-label">Compare leg</p>
              <strong>{right.product}</strong>
              <p>
                {right.market ?? "Unassigned"} market, front {right.frontSymbol ?? "n/a"}.
              </p>
            </article>
            <article className="workspace-stage-card">
              <p className="card-label">Latest spread</p>
              <strong>
                {formatMetricDelta(
                  (latestRow?.leftValue ?? 0) - (latestRow?.rightValue ?? 0),
                  chartMetric,
                )}
              </strong>
              <p>
                {priorRow
                  ? `Gap vs prior bucket: ${formatMetricDelta(
                      (latestRow?.leftValue ?? 0) -
                        (latestRow?.rightValue ?? 0) -
                        ((priorRow.leftValue ?? 0) - (priorRow.rightValue ?? 0)),
                      chartMetric,
                    )}.`
                  : "First visible week in the current window."}
              </p>
            </article>
          </div>

          <OverlayComparisonChart
            chartMetric={chartMetric}
            leftProduct={left.product}
            rightProduct={right.product}
            rows={overlayRows}
          />
        </article>

        <aside className="workspace-rail">
          <article className="workspace-panel workspace-rail-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Watchlist</p>
                <h3>Active products</h3>
              </div>
              <p className="panel-meta">Highest activity inside the current workspace scope.</p>
            </div>

            <div className="watchlist-list">
              {watchlist.map((item) => (
                <article key={item.product} className="watchlist-item">
                  <div className="watchlist-copy">
                    <strong>{item.product}</strong>
                    <span>
                      {item.market ?? "Unassigned"} |{" "}
                      {integerFormatter.format(item.totalVolume)} vol /{" "}
                      {integerFormatter.format(item.openInterest)} OI
                    </span>
                  </div>
                  <div className="watchlist-actions">
                    <button
                      type="button"
                      className="workspace-button"
                      onClick={() => {
                        setSelectedProduct(item.product);
                        setLeftProduct(item.product);
                      }}
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      className="workspace-button workspace-button-secondary"
                      onClick={() => setRightProduct(item.product)}
                    >
                      Compare
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="workspace-panel workspace-rail-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Front movers</p>
                <h3>Settlement change board</h3>
              </div>
              <p className="panel-meta">Ranked by absolute front-month move.</p>
            </div>

            <div className="rail-list">
              {settlementMovers.map((item) => (
                <div key={item.product} className="rail-list-item">
                  <div>
                    <strong>{item.product}</strong>
                    <p>
                      {item.frontSymbol ?? "n/a"} settle {formatPrice(item.frontSettle)}
                    </p>
                  </div>
                  <span className="workspace-badge">
                    {formatSignedDecimal(item.frontSettleChange)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="workspace-panel workspace-rail-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Fee leaders</p>
                <h3>Modeled fee concentration</h3>
              </div>
              <p className="panel-meta">Base model only. Scenario overrides live in the Revenue tab.</p>
            </div>

            <div className="rail-list">
              {revenueLeaders.map((item) => (
                <div key={item.product} className="rail-list-item">
                  <div>
                    <strong>{item.product}</strong>
                    <p>{item.pricingGroup ?? "Unpriced"}</p>
                  </div>
                  <span className="workspace-badge workspace-badge-muted">
                    {currencyFormatter.format(item.latestEstimatedRevenue ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="workspace-tab-shell">
        <div className="workspace-tab-header">
          <div>
            <p className="eyebrow">Workspace tab</p>
            <h2>{WORKSPACE_TABS.find((item) => item[0] === activeTab)?.[1]} view</h2>
          </div>
          <p className="workspace-tab-copy">
            {WORKSPACE_TABS.find((item) => item[0] === activeTab)?.[2]}
          </p>
        </div>

        {activeTab === "market" ? (
          <div className="market-deck">
            <div className="dashboard-chart-grid">
              <LineChartCard
                eyebrow="Market trend"
                title="Weekly traded volume"
                meta={`Window: ${timeWindowLabel}`}
                ariaLabel="Weekly traded volume"
                points={snapshot.weeklyTrends.slice(-6).map((trend) => ({
                  label: shortRange(trend.periodStart, trend.periodEnd),
                  value: trend.totalVolume,
                  note: `${integerFormatter.format(trend.activeContracts)} active`,
                }))}
              />
              <LineChartCard
                eyebrow="Market trend"
                title="Week-end open interest"
                meta="Snapshot basis: last visible trade date in each weekly bucket"
                ariaLabel="Week-end open interest"
                accent="secondary"
                points={snapshot.weeklyTrends.slice(-6).map((trend) => ({
                  label: shortRange(trend.periodStart, trend.periodEnd),
                  value: trend.openInterest,
                  note: `${integerFormatter.format(trend.activeProducts)} products`,
                }))}
              />
            </div>

            <div className="market-grid">
              <article className="workspace-panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Settlement ladder heatmap</p>
                    <h3>Product by tenor visibility</h3>
                  </div>
                  <p className="panel-meta">
                    Front and deferred contracts, colored by daily settle change.
                  </p>
                </div>

                <div className="settlement-heatmap" role="img" aria-label="Settlement ladder heatmap">
                  <div className="heatmap-header">
                    <span>Product</span>
                    {["Front", "T+1", "T+2", "T+3", "T+4"].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  {[...activeDrilldowns]
                    .filter(
                      (item) =>
                        item.contractDetails.some((contract) => contract.hasSettlement) ||
                        item.pricedContracts > 0,
                    )
                    .sort(
                      (leftItem, rightItem) =>
                        rightItem.pricedContracts - leftItem.pricedContracts ||
                        rightItem.totalVolume - leftItem.totalVolume ||
                        leftItem.product.localeCompare(rightItem.product),
                    )
                    .slice(0, 6)
                    .map((item) => (
                      <div key={item.product} className="heatmap-row">
                        <div className="heatmap-product">
                          <strong>{item.product}</strong>
                          <span>{item.market ?? "Unassigned"}</span>
                        </div>
                        {[0, 1, 2, 3, 4].map((index) => {
                          const contract = item.contractDetails.filter(
                            (detail) => detail.hasSettlement,
                          )[index] ?? null;

                          return (
                            <div
                              key={`${item.product}-${index}`}
                              className={
                                contract ? "heatmap-cell" : "heatmap-cell heatmap-cell-empty"
                              }
                              style={buildHeatmapStyle(contract)}
                            >
                              {contract ? (
                                <>
                                  <strong>{contract.symbol}</strong>
                                  <span>{formatPrice(contract.settlementMark)}</span>
                                </>
                              ) : (
                                <span>n/a</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              </article>

              <article className="workspace-panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Small multiples</p>
                    <h3>Product activity snapshots</h3>
                  </div>
                  <p className="panel-meta">
                    Top watchlist names shown as mini trend cards instead of a long table.
                  </p>
                </div>

                <div className="small-multiples-grid">
                  {watchlist.slice(0, 4).map((item) => (
                    <article key={item.product} className="mini-trend-card">
                      <div className="mini-trend-copy">
                        <div>
                          <p className="card-label">{item.market ?? "Unassigned"}</p>
                          <strong>{item.product}</strong>
                        </div>
                        <span>{integerFormatter.format(item.activeContracts)} active contracts</span>
                      </div>
                      <MiniSparkline
                        points={item.weeklyTrends.slice(-6).map((trend) => trend.totalVolume)}
                      />
                      <div className="mini-trend-stats">
                        <span>{integerFormatter.format(item.totalVolume)} vol</span>
                        <span>{integerFormatter.format(item.openInterest)} OI</span>
                        <span>
                          {item.latestEstimatedRevenue === null
                            ? "Unpriced"
                            : currencyFormatter.format(item.latestEstimatedRevenue)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          </div>
        ) : null}

        {activeTab === "workflow" ? (
          <ProductAnalysisWorkbench
            drilldowns={activeDrilldowns}
            snapshotAsOf={snapshot.asOf}
            settlementAsOf={snapshot.settlementAsOf}
            selectedProduct={resolvedSelected}
            leftProduct={resolvedLeft}
            rightProduct={resolvedRight}
            onSelectedProductChange={(product) => {
              setSelectedProduct(product);
              setLeftProduct(product);
            }}
            onLeftProductChange={(product) => {
              setSelectedProduct(product);
              setLeftProduct(product);
            }}
            onRightProductChange={setRightProduct}
          />
        ) : null}

        {activeTab === "revenue" ? (
          <RevenueScenarioPanel
            revenueModel={snapshot.revenueModel}
            snapshotAsOf={snapshot.asOf}
          />
        ) : null}
      </section>

      <details className="workspace-methodology">
        <summary>Methodology and live surface</summary>
        <div className="methodology-grid">
          <article className="methodology-card">
            <p className="card-label">Observed endpoints</p>
            <strong>Products, instruments, historical snapshot, settlement curves, time series</strong>
            <p>
              The workspace is currently backed by the public `products`,
              `instruments`, `historical-data`, `settlement-data`, and
              `historical-data/time-series` endpoints.
            </p>
          </article>
          <article className="methodology-card">
            <p className="card-label">Aggregation rule</p>
            <strong>Flows are summed. Marks are point-in-time. Revenue is modeled.</strong>
            <p>
              Weekly volume is aggregated through the bucket. Open interest and
              breadth are carried from the last visible trade date in that week.
              Settlement ladders are not averaged through time.
            </p>
          </article>
          <article className="methodology-card">
            <p className="card-label">Next useful data</p>
            <strong>Alerts, persistence, richer compare states, block-trade depth</strong>
            <p>
              The current workspace focuses on public market data already proven
              accessible. The next expansion is behavior and persistence, not more
              explanatory copy.
            </p>
          </article>
        </div>
      </details>
    </>
  );
}

function MiniSparkline({ points }: { points: number[] }) {
  const normalized = points.length > 0 ? points : [0];
  const width = 240;
  const height = 72;
  const maxValue = Math.max(...normalized, 1);
  const line = normalized
    .map((value, index) => {
      const x =
        normalized.length === 1
          ? width / 2
          : (index / (normalized.length - 1)) * width;
      const y = height - (value / maxValue) * (height - 10) - 5;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="mini-sparkline" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} className="mini-sparkline-svg" preserveAspectRatio="none">
        <path d={area} className="sparkline-area" />
        <path d={line} className="sparkline-path" />
      </svg>
    </div>
  );
}

function OverlayComparisonChart({
  chartMetric,
  leftProduct,
  rightProduct,
  rows,
}: {
  chartMetric: ChartMetric;
  leftProduct: string;
  rightProduct: string;
  rows: Array<{
    label: string;
    periodStart: string;
    leftValue: number;
    rightValue: number;
  }>;
}) {
  const normalizedRows =
    rows.length > 0
      ? rows
      : [{ label: "n/a", periodStart: "n/a", leftValue: 0, rightValue: 0 }];
  const width = 860;
  const height = 320;
  const maxValue = Math.max(
    ...normalizedRows.flatMap((row) => [row.leftValue, row.rightValue]),
    1,
  );
  const leftSeries = buildSeries(normalizedRows, "leftValue", width, height, maxValue);
  const rightSeries = buildSeries(normalizedRows, "rightValue", width, height, maxValue);

  return (
    <div className="workspace-overlay-shell">
      <div className="workspace-legend">
        <div className="workspace-legend-item">
          <span className="workspace-legend-swatch workspace-legend-swatch-primary" />
          <strong>{leftProduct}</strong>
          <small>{formatMetricValue(leftSeries.at(-1)?.value ?? 0, chartMetric)}</small>
        </div>
        <div className="workspace-legend-item">
          <span className="workspace-legend-swatch workspace-legend-swatch-secondary" />
          <strong>{rightProduct}</strong>
          <small>{formatMetricValue(rightSeries.at(-1)?.value ?? 0, chartMetric)}</small>
        </div>
      </div>

      <div className="workspace-overlay-chart" role="img" aria-label={`Weekly ${chartMetric} overlay`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="workspace-overlay-svg" preserveAspectRatio="none">
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = 20 + (height - 60) * ratio;
            return (
              <line
                key={ratio}
                x1="28"
                x2={width - 28}
                y1={y}
                y2={y}
                className="workspace-gridline"
              />
            );
          })}
          <polyline
            points={leftSeries.map((point) => `${point.x},${point.y}`).join(" ")}
            className="workspace-overlay-line workspace-overlay-line-primary"
          />
          <polyline
            points={rightSeries.map((point) => `${point.x},${point.y}`).join(" ")}
            className="workspace-overlay-line workspace-overlay-line-secondary"
          />
          {leftSeries.map((point) => (
            <circle
              key={`left-${point.key}`}
              cx={point.x}
              cy={point.y}
              r="5"
              className="workspace-overlay-dot workspace-overlay-dot-primary"
            />
          ))}
          {rightSeries.map((point) => (
            <circle
              key={`right-${point.key}`}
              cx={point.x}
              cy={point.y}
              r="5"
              className="workspace-overlay-dot workspace-overlay-dot-secondary"
            />
          ))}
        </svg>
      </div>

      <div className="workspace-chart-footer">
        {normalizedRows.map((row) => (
          <div key={row.periodStart} className="workspace-footer-item">
            <span>{row.label}</span>
            <strong>
              {formatMetricValue(row.leftValue, chartMetric)} /{" "}
              {formatMetricValue(row.rightValue, chartMetric)}
            </strong>
            <small>
              {leftProduct} vs {rightProduct}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSeries(
  rows: Array<{
    label: string;
    periodStart: string;
    leftValue: number;
    rightValue: number;
  }>,
  key: "leftValue" | "rightValue",
  width: number,
  height: number,
  maxValue: number,
) {
  return rows.map((row, index) => ({
    key: row.periodStart,
    label: row.label,
    value: row[key],
    x:
      28 +
      (rows.length === 1
        ? (width - 56) / 2
        : (index / (rows.length - 1)) * (width - 56)),
    y: 20 + (height - 60) - (row[key] / maxValue) * (height - 60),
  }));
}

function buildOverlayRows(
  left: DashboardSnapshot["productDrilldowns"][number],
  right: DashboardSnapshot["productDrilldowns"][number],
  chartMetric: ChartMetric,
) {
  const periods = new Map<
    string,
    {
      periodStart: string;
      periodEnd: string;
      leftTrend: (typeof left.weeklyTrends)[number] | null;
      rightTrend: (typeof right.weeklyTrends)[number] | null;
    }
  >();

  for (const trend of left.weeklyTrends.slice(-6)) {
    periods.set(trend.periodStart, {
      periodStart: trend.periodStart,
      periodEnd: trend.periodEnd,
      leftTrend: trend,
      rightTrend: null,
    });
  }

  for (const trend of right.weeklyTrends.slice(-6)) {
    const current = periods.get(trend.periodStart) ?? {
      periodStart: trend.periodStart,
      periodEnd: trend.periodEnd,
      leftTrend: null,
      rightTrend: null,
    };
    current.periodEnd = current.leftTrend?.periodEnd ?? trend.periodEnd;
    current.rightTrend = trend;
    periods.set(trend.periodStart, current);
  }

  return [...periods.values()]
    .sort((leftRow, rightRow) => leftRow.periodStart.localeCompare(rightRow.periodStart))
    .slice(-6)
    .map((row) => ({
      label: shortRange(row.periodStart, row.periodEnd),
      periodStart: row.periodStart,
      leftValue: metricValue(row.leftTrend, chartMetric),
      rightValue: metricValue(row.rightTrend, chartMetric),
    }));
}

function metricValue(
  trend: DashboardSnapshot["productDrilldowns"][number]["weeklyTrends"][number] | null,
  chartMetric: ChartMetric,
) {
  if (!trend) {
    return 0;
  }

  switch (chartMetric) {
    case "openInterest":
      return trend.openInterest;
    case "fees":
      return trend.estimatedRevenue ?? 0;
    case "volume":
    default:
      return trend.totalVolume;
  }
}

function buildHeatmapStyle(
  contract: DashboardSnapshot["productDrilldowns"][number]["contractDetails"][number] | null,
): CSSProperties | undefined {
  if (!contract) {
    return undefined;
  }

  const change = contract.settlementChange ?? contract.snapshotSettleChange ?? 0;
  const intensity = Math.min(Math.max(Math.abs(change) / 1.25, 0.18), 0.9);
  const tone = change >= 0 ? "82, 185, 129" : "240, 141, 81";

  return {
    "--heat": `${intensity}`,
    "--tone": tone,
  } as CSSProperties;
}

function resolveProduct(
  drilldowns: DashboardSnapshot["productDrilldowns"],
  product: string,
) {
  return drilldowns.some((item) => item.product === product) ? product : null;
}

function formatMetricValue(value: number, metric: ChartMetric): string {
  if (metric === "fees") {
    return currencyFormatter.format(value);
  }

  return integerFormatter.format(value);
}

function formatMetricDelta(value: number, metric: ChartMetric): string {
  const formatted = formatMetricValue(Math.abs(value), metric);
  if (value === 0) {
    return formatted;
  }

  return `${value > 0 ? "+" : "-"}${formatted}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "n/a";
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatPrice(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return decimalFormatter.format(value);
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

function formatWindow(fromDate: string | null, tillDate: string | null): string {
  if (!fromDate || !tillDate) {
    return "Latest visible range";
  }

  return `${formatDate(fromDate)} to ${formatDate(tillDate)}`;
}

function formatWindowOption(days: number): string {
  if (days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }

  return `${days} days`;
}

function shortRange(start: string, end: string): string {
  if (start === end) {
    return shortDate(start);
  }

  return `${shortDate(start)}-${shortDate(end)}`;
}

function shortDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

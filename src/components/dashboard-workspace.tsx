"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
type HeroView = "market" | "focus" | "compare";
type Granularity = "daily" | "weekly";

type ScopedWeeklyTrend = {
  periodStart: string;
  periodEnd: string;
  totalVolume: number;
  openInterest: number;
  activeContracts: number;
  activeProducts: number;
  estimatedRevenue: number;
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
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const WORKSPACE_TABS = [
  ["market", "Market", "Chart-first activity, settlement, and movers."],
  ["workflow", "Workflow", "Rank, inspect, and compare products in one loop."],
  ["revenue", "Revenue", "Stress the fee model without changing observed flow."],
] as const satisfies ReadonlyArray<readonly [WorkspaceTab, string, string]>;


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
  const [showOiOverlay, setShowOiOverlay] = useState(false);
  const [heroView, setHeroView] = useState<HeroView>("market");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
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
  const focused =
    activeDrilldowns.find((item) => item.product === resolvedSelected) ??
    activeDrilldowns[0];

  const granularity: Granularity =
    requestedWindowDays > 0 && requestedWindowDays <= 30 ? "daily" : "weekly";
  const isDaily = granularity === "daily";

  const overlayRows = buildOverlayRows(left, right, "volume", isDaily);
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
    requestedWindowDays,
  );
  // Bars always show volume; OI is an optional line overlay
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
  const scopedWeeklyTrends = buildScopedWeeklyTrends(activeDrilldowns);
  const scopedTrends = isDaily
    ? buildScopedDailyTrends(activeDrilldowns)
    : scopedWeeklyTrends;

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

  const datesMatch =
    snapshot.asOf === requestedAsOf && snapshot.settlementAsOf === requestedAsOf;
  const snapshotStatusLabel = datesMatch
    ? null
    : `Requested ${formatDate(requestedAsOf)}. Activity resolved to ${formatDate(snapshot.asOf)} and settlement resolved to ${formatDate(snapshot.settlementAsOf)}.`;

  return (
    <>
      <header className="workspace-command-bar">
        <div className="command-bar-row command-bar-row-tabs">
          <div className="workspace-segmented" aria-label="Workspace tabs" role="tablist">
            {WORKSPACE_TABS.map(([id, label, detail]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-label={`${label} tab: ${detail}`}
                className={
                  activeTab === id
                    ? "workspace-segment workspace-segment-active"
                    : "workspace-segment"
                }
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="command-bar-row-end">
            {!datesMatch && (
              <span className="workspace-badge workspace-badge-muted command-bar-status">
                Fallback dates
              </span>
            )}

            <button
              type="button"
              className={
                filtersExpanded
                  ? "workspace-action-button workspace-filters-toggle workspace-filters-toggle-active"
                  : "workspace-action-button workspace-filters-toggle"
              }
              aria-expanded={filtersExpanded}
              aria-controls="workspace-filters-drawer"
              onClick={() => setFiltersExpanded((prev) => !prev)}
            >
              Filters
            </button>
          </div>
        </div>

        {filtersExpanded && (
          <div
            id="workspace-filters-drawer"
            className="command-bar-row command-bar-row-controls"
          >
            <div className="command-group">
              <span className="command-group-label">Snapshot</span>
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

            <div className="command-group">
              <span className="command-group-label">Scope</span>
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
                    setHeroView("focus");
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
                  onChange={(event) => {
                    setRightProduct(event.currentTarget.value);
                    setHeroView("compare");
                  }}
                >
                  {activeDrilldowns.map((item) => (
                    <option key={item.product} value={item.product}>
                      {item.product} | {item.market ?? "Unassigned"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="command-group command-group-end">
              <button
                type="button"
                className="workspace-action-button workspace-action-button-secondary"
                onClick={() => {
                  setActiveTab("market");
                  setShowOiOverlay(false);
                  setHeroView("market");
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
          </div>
        )}
      </header>

      <section className="workspace-kpi-strip" aria-label="KPI strip">
        <article className="workspace-kpi-card workspace-kpi-card-accent">
          <p className="card-label">Products</p>
          <strong>{integerFormatter.format(activeDrilldowns.length)}</strong>
          <p>{marketFilter === "all" ? "All markets" : marketFilter}</p>
        </article>
        <article className="workspace-kpi-card">
          <p className="card-label">Listed contracts</p>
          <strong>{integerFormatter.format(listedContracts)}</strong>
          <p>{integerFormatter.format(markedProducts)} marked</p>
        </article>
        <article className="workspace-kpi-card">
          <p className="card-label">Volume ({snapshot.asOf ? shortDate(snapshot.asOf) : "latest"})</p>
          <strong>{integerFormatter.format(totalVolume)} lots</strong>
          <p>{integerFormatter.format(openInterest)} OI</p>
        </article>
        <article className="workspace-kpi-card">
          <p className="card-label">Est. fees ({snapshot.asOf ? shortDate(snapshot.asOf) : "latest"})</p>
          <strong>{currencyFormatter.format(modeledFees)}</strong>
          <p>Scenario-aware</p>
        </article>
      </section>

      <section className="workspace-hero-chart">
        <article className="workspace-panel workspace-panel-stage">
          {heroView === "market" ? (
            <>
              <ChartPanelToolbar
                title="Market volume trend"
                eyebrow="Abaxx exchange / Market overview"
                timeWindowLabel={timeWindowLabel}
                granularity={granularity}
                snapshotStatusLabel={snapshotStatusLabel}
                showOiOverlay={showOiOverlay}
                onOiOverlayChange={setShowOiOverlay}
              >
                <button
                  type="button"
                  className="workspace-view-toggle"
                  onClick={() => setHeroView("compare")}
                >
                  Compare products
                </button>
              </ChartPanelToolbar>

              <MarketAggregateSummary
                scopedTrends={scopedTrends}
                activeDrilldowns={activeDrilldowns}
                granularity={granularity}
              />

              <MarketAggregateChart
                scopedTrends={scopedTrends}
                showOiOverlay={showOiOverlay}
                deltaLabel={isDaily ? "DoD" : "WoW"}
              />
            </>
          ) : heroView === "focus" ? (
            <>
              <ChartPanelToolbar
                title={`${focused.product} volume trend`}
                eyebrow={`Product focus / ${focused.product}`}
                timeWindowLabel={timeWindowLabel}
                granularity={granularity}
                snapshotStatusLabel={snapshotStatusLabel}
                showOiOverlay={showOiOverlay}
                onOiOverlayChange={setShowOiOverlay}
              >
                <button
                  type="button"
                  className="workspace-view-toggle"
                  onClick={() => setHeroView("market")}
                >
                  Market overview
                </button>
                <button
                  type="button"
                  className="workspace-view-toggle"
                  onClick={() => setHeroView("compare")}
                >
                  Compare
                </button>
              </ChartPanelToolbar>

              <FocusSummary
                product={focused}
                granularity={granularity}
              />

              <FocusChart
                product={focused}
                isDaily={isDaily}
                showOiOverlay={showOiOverlay}
              />
            </>
          ) : (
            <>
              <ChartPanelToolbar
                title="Volume comparison"
                eyebrow={`Compare / ${left.product} vs ${right.product}`}
                timeWindowLabel={timeWindowLabel}
                granularity={granularity}
                snapshotStatusLabel={snapshotStatusLabel}
                showOiOverlay={showOiOverlay}
                onOiOverlayChange={setShowOiOverlay}
              >
                <button
                  type="button"
                  className="workspace-view-toggle"
                  onClick={() => setHeroView("market")}
                >
                  Market overview
                </button>
              </ChartPanelToolbar>

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
                      "volume",
                    )}
                  </strong>
                  <p>
                    {priorRow
                      ? `Gap vs prior bucket: ${formatMetricDelta(
                          (latestRow?.leftValue ?? 0) -
                            (latestRow?.rightValue ?? 0) -
                            ((priorRow.leftValue ?? 0) - (priorRow.rightValue ?? 0)),
                          "volume",
                        )}.`
                      : "First visible week in the current window."}
                  </p>
                </article>
              </div>

              <OverlayComparisonChart
                chartMetric="volume"
                leftProduct={left.product}
                rightProduct={right.product}
                rows={overlayRows}
              />
            </>
          )}
        </article>
      </section>

      <section className="workspace-info-panels">
        <article className="workspace-panel workspace-rail-panel workspace-rail-panel-primary">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Watchlist</p>
              <h3>Active products</h3>
            </div>
            <p className="panel-meta">Top activity in scope</p>
          </div>

          <div className="watchlist-list">
            {watchlist.map((item) => {
              const isFocused = heroView === "focus" && resolvedSelected === item.product;
              const isCompareLeft = heroView === "compare" && resolvedLeft === item.product;
              const isCompareRight = heroView === "compare" && resolvedRight === item.product;
              const rowClass = [
                "watchlist-item",
                isFocused ? "watchlist-item-focused" : "",
                isCompareLeft ? "watchlist-item-compare-left" : "",
                isCompareRight ? "watchlist-item-compare-right" : "",
              ].filter(Boolean).join(" ");

              return (
                <article key={item.product} className={rowClass}>
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
                      className={isFocused ? "workspace-button workspace-button-active" : "workspace-button"}
                      onClick={() => {
                        if (isFocused) {
                          setHeroView("market");
                        } else {
                          setSelectedProduct(item.product);
                          setLeftProduct(item.product);
                          setHeroView("focus");
                        }
                      }}
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      className={
                        isCompareLeft || isCompareRight
                          ? "workspace-button workspace-button-secondary workspace-button-active"
                          : "workspace-button workspace-button-secondary"
                      }
                      onClick={() => {
                        if (isCompareRight) {
                          setRightProduct(resolvedLeft);
                          setHeroView(heroView === "compare" ? "market" : heroView);
                        } else if (isCompareLeft) {
                          setHeroView("market");
                        } else {
                          setRightProduct(item.product);
                          setHeroView("compare");
                        }
                      }}
                    >
                      Compare
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <article className="workspace-panel workspace-rail-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Front movers</p>
              <h3>Settlement change board</h3>
            </div>
            <p className="panel-meta">By absolute front-month move</p>
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
            <p className="panel-meta">Base model. Scenarios in Revenue tab.</p>
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
      </section>

      <section className="workspace-tab-shell">
        {activeTab === "market" ? (
          <div className="market-deck">
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
                      <div className="mini-trend-header">
                        <strong className="mini-trend-product">{item.product}</strong>
                        <span className="mini-trend-market">{item.market ?? "Unassigned"}</span>
                      </div>
                      <MiniSparkline
                        points={item.weeklyTrends.slice(-6).map((trend) => trend.totalVolume)}
                      />
                      <div className="mini-trend-stats">
                        <div className="mini-trend-stat">
                          <span className="mini-trend-stat-label">Vol</span>
                          <span className="mini-trend-stat-value">{integerFormatter.format(item.totalVolume)}</span>
                        </div>
                        <div className="mini-trend-stat">
                          <span className="mini-trend-stat-label">OI</span>
                          <span className="mini-trend-stat-value">{integerFormatter.format(item.openInterest)}</span>
                        </div>
                        <div className="mini-trend-stat">
                          <span className="mini-trend-stat-label">Fees</span>
                          <span className="mini-trend-stat-value">
                            {item.latestEstimatedRevenue === null
                              ? "—"
                              : currencyFormatter.format(item.latestEstimatedRevenue)}
                          </span>
                        </div>
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

function ChartPanelToolbar({
  title,
  eyebrow,
  timeWindowLabel,
  granularity,
  snapshotStatusLabel,
  showOiOverlay,
  onOiOverlayChange,
  children,
}: {
  title: string;
  eyebrow: string;
  timeWindowLabel: string;
  granularity: Granularity;
  snapshotStatusLabel: string | null;
  showOiOverlay: boolean;
  onOiOverlayChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="chart-panel-toolbar">
      <div className="chart-panel-toolbar-top">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="chart-panel-toolbar-meta">
          <span className="workspace-badge workspace-badge-muted">{timeWindowLabel}</span>
          <span className="granularity-badge">{granularity === "daily" ? "Daily" : "Weekly"}</span>
          {snapshotStatusLabel ? (
            <p className="workspace-panel-meta">{snapshotStatusLabel}</p>
          ) : null}
          {children}
        </div>
      </div>
      <div className="chart-panel-controls">
        <button
          type="button"
          className={
            showOiOverlay
              ? "workspace-pill workspace-pill-active"
              : "workspace-pill"
          }
          onClick={() => onOiOverlayChange(!showOiOverlay)}
        >
          Show OI
        </button>
      </div>
    </div>
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

function MarketAggregateSummary({
  scopedTrends,
  activeDrilldowns,
  granularity,
}: {
  scopedTrends: ScopedWeeklyTrend[];
  activeDrilldowns: DashboardSnapshot["productDrilldowns"];
  granularity: Granularity;
}) {
  const maxBuckets = granularity === "daily" ? 31 : 6;
  const buckets = scopedTrends.slice(-maxBuckets);
  const latest = buckets.at(-1);
  const prior = buckets.at(-2);

  const latestValue = scopedMetricValue(latest, "volume");
  const priorValue = scopedMetricValue(prior, "volume");
  const delta = latestValue - priorValue;
  const pctChange =
    priorValue > 0 ? ((delta / priorValue) * 100).toFixed(1) : null;
  const activeProducts = latest?.activeProducts ?? 0;
  const activeContracts = latest?.activeContracts ?? 0;
  const markCount = activeDrilldowns.filter(
    (item) => item.pricedContracts > 0,
  ).length;

  const latestLabel = granularity === "daily" ? "Latest day" : "Latest week";
  const changeLabel = granularity === "daily" ? "Day-over-day" : "Week-over-week";
  const firstLabel = granularity === "daily" ? "First visible day" : "First visible week";

  return (
    <div className="workspace-stage-summary">
      <article className="workspace-stage-card">
        <p className="card-label">{latestLabel}</p>
        <strong>{formatMetricValue(latestValue, "volume")}</strong>
        <p>
          {latest
            ? shortRange(latest.periodStart, latest.periodEnd)
            : "No data"}
        </p>
      </article>
      <article className="workspace-stage-card">
        <p className="card-label">{changeLabel}</p>
        <strong>{formatMetricDelta(delta, "volume")}</strong>
        <p>
          {pctChange !== null
            ? `${delta >= 0 ? "+" : ""}${pctChange}% from prior bucket`
            : firstLabel}
        </p>
      </article>
      <article className="workspace-stage-card">
        <p className="card-label">Market breadth</p>
        <strong>
          {integerFormatter.format(activeProducts)} product
          {activeProducts === 1 ? "" : "s"}
        </strong>
        <p>
          {integerFormatter.format(activeContracts)} active listings,{" "}
          {integerFormatter.format(markCount)} marked
        </p>
      </article>
    </div>
  );
}

function FocusSummary({
  product,
  granularity,
}: {
  product: DashboardSnapshot["productDrilldowns"][number];
  granularity: Granularity;
}) {
  const trends = getProductTrends(product, granularity === "daily");
  const maxBuckets = granularity === "daily" ? 31 : 6;
  const buckets = trends.slice(-maxBuckets);
  const latest = buckets.at(-1);
  const prior = buckets.at(-2);

  const latestValue = metricValue(latest ?? null, "volume");
  const priorValue = metricValue(prior ?? null, "volume");
  const delta = latestValue - priorValue;
  const pctChange =
    priorValue > 0 ? ((delta / priorValue) * 100).toFixed(1) : null;

  const latestLabel = granularity === "daily" ? "Latest day" : "Latest week";
  const changeLabel = granularity === "daily" ? "Day-over-day" : "Week-over-week";
  const firstLabel = granularity === "daily" ? "First visible day" : "First visible week";

  return (
    <div className="workspace-stage-summary">
      <article className="workspace-stage-card">
        <p className="card-label">Product</p>
        <strong>{product.product}</strong>
        <p>{product.market ?? "Unassigned"} market, front {product.frontSymbol ?? "n/a"}</p>
      </article>
      <article className="workspace-stage-card">
        <p className="card-label">{latestLabel}</p>
        <strong>{formatMetricValue(latestValue, "volume")}</strong>
        <p>
          {latest
            ? shortRange(latest.periodStart, latest.periodEnd)
            : "No data"}
        </p>
      </article>
      <article className="workspace-stage-card">
        <p className="card-label">{changeLabel}</p>
        <strong>{formatMetricDelta(delta, "volume")}</strong>
        <p>
          {pctChange !== null
            ? `${delta >= 0 ? "+" : ""}${pctChange}% from prior bucket`
            : firstLabel}
        </p>
      </article>
    </div>
  );
}

function FocusChart({
  product,
  isDaily,
  showOiOverlay,
}: {
  product: DashboardSnapshot["productDrilldowns"][number];
  isDaily: boolean;
  showOiOverlay: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const trends = getProductTrends(product, isDaily);
  const maxBuckets = isDaily ? 31 : 6;
  const data = trends.slice(-maxBuckets).map((trend) => ({
    label: shortRange(trend.periodStart, trend.periodEnd),
    periodStart: trend.periodStart,
    value: metricValue(trend, "volume"),
    oi: trend.openInterest,
    activeContracts: trend.activeContracts,
  }));

  if (data.length === 0) {
    return null;
  }

  const width = 860;
  const height = 340;
  const paddingX = 28;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const maxOi = showOiOverlay ? Math.max(...data.map((d) => d.oi), 1) : 1;
  const barGap = Math.max(8, 16 - data.length * 2);
  const usableWidth = width - paddingX * 2;
  const barWidth =
    (usableWidth - barGap * (data.length - 1)) / data.length;

  const oiLinePoints = showOiOverlay
    ? data.map((d, i) => {
        const cx = paddingX + i * (barWidth + barGap) + barWidth / 2;
        const cy = paddingTop + chartHeight - (d.oi / maxOi) * chartHeight;
        return { cx, cy, value: d.oi };
      })
    : [];

  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const priorItem = hoveredIndex !== null && hoveredIndex > 0 ? data[hoveredIndex - 1] : null;

  return (
    <div className="market-aggregate-shell">
      <div
        className="market-aggregate-chart"
        role="img"
        aria-label={`${product.product} volume trend`}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="market-aggregate-svg"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                className="workspace-gridline"
              />
            );
          })}
          {data.map((d, i) => {
            const barH = (d.value / maxValue) * chartHeight;
            const x = paddingX + i * (barWidth + barGap);
            const y = paddingTop + chartHeight - barH;
            return (
              <rect
                key={d.periodStart}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                className={hoveredIndex === i ? "market-bar market-bar-hovered" : "market-bar"}
                rx="4"
              />
            );
          })}
          {showOiOverlay && oiLinePoints.length > 1 && (
            <polyline
              points={oiLinePoints.map((p) => `${p.cx},${p.cy}`).join(" ")}
              className="chart-line-oi"
            />
          )}
          {showOiOverlay && oiLinePoints.map((p, i) => (
            <circle
              key={`oi-${i}`}
              cx={p.cx}
              cy={p.cy}
              r={hoveredIndex === i ? 6 : 4}
              className={hoveredIndex === i ? "chart-dot-oi chart-dot-hovered" : "chart-dot-oi"}
            />
          ))}
          {data.map((d, i) => {
            const x = paddingX + i * (barWidth + barGap);
            const hitW = i < data.length - 1 ? barWidth + barGap : barWidth;
            return (
              <rect
                key={`hit-${d.periodStart}`}
                x={x}
                y={paddingTop}
                width={hitW}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}
        </svg>

        {hoveredItem && (
          <ChartTooltip
            label={hoveredItem.label}
            value={`${integerFormatter.format(hoveredItem.value)} lots`}
            delta={priorItem ? formatMetricDelta(hoveredItem.value - priorItem.value, "volume") : null}
            deltaLabel={isDaily ? "DoD" : "WoW"}
            detail={
              showOiOverlay
                ? `${integerFormatter.format(hoveredItem.oi)} OI · ${integerFormatter.format(hoveredItem.activeContracts)} contracts`
                : `${integerFormatter.format(hoveredItem.activeContracts)} active contracts`
            }
          />
        )}
      </div>
    </div>
  );
}

function MarketAggregateChart({
  scopedTrends,
  showOiOverlay,
  deltaLabel = "WoW",
}: {
  scopedTrends: ScopedWeeklyTrend[];
  showOiOverlay: boolean;
  deltaLabel?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const data = scopedTrends.slice(-31).map((bucket) => ({
    label: shortRange(bucket.periodStart, bucket.periodEnd),
    periodStart: bucket.periodStart,
    value: scopedMetricValue(bucket, "volume"),
    oi: bucket.openInterest,
    activeProducts: bucket.activeProducts,
  }));

  if (data.length === 0) {
    return null;
  }

  const width = 860;
  const height = 340;
  const paddingX = 28;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const maxOi = showOiOverlay ? Math.max(...data.map((d) => d.oi), 1) : 1;
  const barGap = Math.max(8, 16 - data.length * 2);
  const usableWidth = width - paddingX * 2;
  const barWidth =
    (usableWidth - barGap * (data.length - 1)) / data.length;

  const oiLinePoints = showOiOverlay
    ? data.map((d, i) => {
        const cx = paddingX + i * (barWidth + barGap) + barWidth / 2;
        const cy = paddingTop + chartHeight - (d.oi / maxOi) * chartHeight;
        return { cx, cy, value: d.oi };
      })
    : [];

  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const priorItem = hoveredIndex !== null && hoveredIndex > 0 ? data[hoveredIndex - 1] : null;

  return (
    <div className="market-aggregate-shell">
      <div
        className="market-aggregate-chart"
        role="img"
        aria-label="Market volume trend"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="market-aggregate-svg"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                className="workspace-gridline"
              />
            );
          })}
          {data.map((d, i) => {
            const barH = (d.value / maxValue) * chartHeight;
            const x = paddingX + i * (barWidth + barGap);
            const y = paddingTop + chartHeight - barH;
            return (
              <rect
                key={d.periodStart}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                className={hoveredIndex === i ? "market-bar market-bar-hovered" : "market-bar"}
                rx="4"
              />
            );
          })}
          {showOiOverlay && oiLinePoints.length > 1 && (
            <polyline
              points={oiLinePoints.map((p) => `${p.cx},${p.cy}`).join(" ")}
              className="chart-line-oi"
            />
          )}
          {showOiOverlay && oiLinePoints.map((p, i) => (
            <circle
              key={`oi-${i}`}
              cx={p.cx}
              cy={p.cy}
              r={hoveredIndex === i ? 6 : 4}
              className={hoveredIndex === i ? "chart-dot-oi chart-dot-hovered" : "chart-dot-oi"}
            />
          ))}
          {data.map((d, i) => {
            const x = paddingX + i * (barWidth + barGap);
            const hitW = i < data.length - 1 ? barWidth + barGap : barWidth;
            return (
              <rect
                key={`hit-${d.periodStart}`}
                x={x}
                y={paddingTop}
                width={hitW}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}
        </svg>

        {hoveredItem && (
          <ChartTooltip
            label={hoveredItem.label}
            value={`${integerFormatter.format(hoveredItem.value)} lots`}
            delta={priorItem ? formatMetricDelta(hoveredItem.value - priorItem.value, "volume") : null}
            deltaLabel={deltaLabel}
            detail={
              showOiOverlay
                ? `${integerFormatter.format(hoveredItem.oi)} OI · ${integerFormatter.format(hoveredItem.activeProducts)} product${hoveredItem.activeProducts === 1 ? "" : "s"}`
                : `${integerFormatter.format(hoveredItem.activeProducts)} product${hoveredItem.activeProducts === 1 ? "" : "s"}`
            }
          />
        )}
      </div>
    </div>
  );
}

function ChartTooltip({
  label,
  value,
  delta,
  deltaLabel = "WoW",
  detail,
}: {
  label: string;
  value: string;
  delta: string | null;
  deltaLabel?: string;
  detail: string;
}) {
  return (
    <div className="chart-tooltip" aria-live="polite">
      <strong>{label}</strong>
      <span className="chart-tooltip-value">{value}</span>
      {delta && <span className="chart-tooltip-delta">{delta} {deltaLabel}</span>}
      <span className="chart-tooltip-detail">{detail}</span>
    </div>
  );
}

function buildScopedWeeklyTrends(
  drilldowns: DashboardSnapshot["productDrilldowns"],
): ScopedWeeklyTrend[] {
  const periods = new Map<string, ScopedWeeklyTrend>();

  for (const drilldown of drilldowns) {
    for (const trend of drilldown.weeklyTrends) {
      const existing = periods.get(trend.periodStart);
      if (existing) {
        existing.totalVolume += trend.totalVolume;
        existing.openInterest += trend.openInterest;
        existing.activeContracts += trend.activeContracts;
        existing.activeProducts += trend.activeProducts;
        existing.estimatedRevenue += trend.estimatedRevenue ?? 0;
      } else {
        periods.set(trend.periodStart, {
          periodStart: trend.periodStart,
          periodEnd: trend.periodEnd,
          totalVolume: trend.totalVolume,
          openInterest: trend.openInterest,
          activeContracts: trend.activeContracts,
          activeProducts: trend.activeProducts,
          estimatedRevenue: trend.estimatedRevenue ?? 0,
        });
      }
    }
  }

  return [...periods.values()].sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart),
  );
}

function buildScopedDailyTrends(
  drilldowns: DashboardSnapshot["productDrilldowns"],
): ScopedWeeklyTrend[] {
  const days = new Map<string, ScopedWeeklyTrend>();

  for (const drilldown of drilldowns) {
    const feePerSide = drilldown.feePerSide;
    for (const daily of drilldown.dailyTrends) {
      const existing = days.get(daily.tradeDate);
      const estimatedRevenue =
        feePerSide === null ? 0 : roundTo(daily.totalVolume * feePerSide * 2, 2);
      if (existing) {
        existing.totalVolume += daily.totalVolume;
        existing.openInterest += daily.openInterest;
        existing.activeContracts += daily.activeContracts;
        existing.activeProducts += daily.activeProducts;
        existing.estimatedRevenue += estimatedRevenue;
      } else {
        days.set(daily.tradeDate, {
          periodStart: daily.tradeDate,
          periodEnd: daily.tradeDate,
          totalVolume: daily.totalVolume,
          openInterest: daily.openInterest,
          activeContracts: daily.activeContracts,
          activeProducts: daily.activeProducts,
          estimatedRevenue,
        });
      }
    }
  }

  return [...days.values()].sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart),
  );
}

function getProductTrends(
  product: DashboardSnapshot["productDrilldowns"][number],
  isDaily: boolean,
): DashboardSnapshot["productDrilldowns"][number]["weeklyTrends"] {
  if (!isDaily) {
    return product.weeklyTrends;
  }

  return product.dailyTrends.map((daily) => ({
    periodStart: daily.tradeDate,
    periodEnd: daily.tradeDate,
    totalVolume: daily.totalVolume,
    openInterest: daily.openInterest,
    activeContracts: daily.activeContracts,
    activeProducts: daily.activeProducts,
    estimatedRevenue:
      product.feePerSide === null
        ? null
        : roundTo(daily.totalVolume * product.feePerSide * 2, 2),
    pricedVolume: 0,
  }));
}

function scopedMetricValue(
  trend: ScopedWeeklyTrend | undefined | null,
  chartMetric: ChartMetric,
): number {
  if (!trend) {
    return 0;
  }

  switch (chartMetric) {
    case "openInterest":
      return trend.openInterest;
    case "fees":
      return trend.estimatedRevenue;
    case "volume":
    default:
      return trend.totalVolume;
  }
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const normalizedRows =
    rows.length > 0
      ? rows
      : [{ label: "n/a", periodStart: "n/a", leftValue: 0, rightValue: 0 }];
  const width = 860;
  const height = 340;
  const maxValue = Math.max(
    ...normalizedRows.flatMap((row) => [row.leftValue, row.rightValue]),
    1,
  );
  const leftSeries = buildSeries(normalizedRows, "leftValue", width, height, maxValue);
  const rightSeries = buildSeries(normalizedRows, "rightValue", width, height, maxValue);

  const hoveredRow = hoveredIndex !== null ? normalizedRows[hoveredIndex] : null;

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

      <div className="workspace-overlay-chart" role="img" aria-label={`${chartMetric} comparison`}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="workspace-overlay-svg"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
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
          {leftSeries.map((point, i) => (
            <circle
              key={`left-${point.key}`}
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? 7 : 5}
              className={hoveredIndex === i ? "workspace-overlay-dot workspace-overlay-dot-primary chart-dot-hovered" : "workspace-overlay-dot workspace-overlay-dot-primary"}
            />
          ))}
          {rightSeries.map((point, i) => (
            <circle
              key={`right-${point.key}`}
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? 7 : 5}
              className={hoveredIndex === i ? "workspace-overlay-dot workspace-overlay-dot-secondary chart-dot-hovered" : "workspace-overlay-dot workspace-overlay-dot-secondary"}
            />
          ))}
          {normalizedRows.map((row, i) => {
            const x = leftSeries[i]?.x ?? 0;
            const hitWidth = i < normalizedRows.length - 1
              ? (leftSeries[i + 1]?.x ?? width) - x
              : width - 28 - x + 28;
            return (
              <rect
                key={`hit-${row.periodStart}`}
                x={Math.max(x - hitWidth / 2, 0)}
                y={20}
                width={hitWidth}
                height={height - 60}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}
        </svg>

        {hoveredRow && (
          <div className="chart-tooltip" aria-live="polite">
            <strong>{hoveredRow.label}</strong>
            <div className="chart-tooltip-compare-row">
              <span className="chart-tooltip-swatch chart-tooltip-swatch-primary" />
              <span>{leftProduct}</span>
              <strong>{formatMetricValue(hoveredRow.leftValue, chartMetric)}</strong>
            </div>
            <div className="chart-tooltip-compare-row">
              <span className="chart-tooltip-swatch chart-tooltip-swatch-secondary" />
              <span>{rightProduct}</span>
              <strong>{formatMetricValue(hoveredRow.rightValue, chartMetric)}</strong>
            </div>
            <span className="chart-tooltip-detail">
              Spread: {formatMetricDelta(hoveredRow.leftValue - hoveredRow.rightValue, chartMetric)}
            </span>
          </div>
        )}
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
  isDaily: boolean,
) {
  const maxBuckets = isDaily ? 31 : 6;
  const leftTrends = getProductTrends(left, isDaily);
  const rightTrends = getProductTrends(right, isDaily);

  const periods = new Map<
    string,
    {
      periodStart: string;
      periodEnd: string;
      leftTrend: (typeof leftTrends)[number] | null;
      rightTrend: (typeof rightTrends)[number] | null;
    }
  >();

  for (const trend of leftTrends.slice(-maxBuckets)) {
    periods.set(trend.periodStart, {
      periodStart: trend.periodStart,
      periodEnd: trend.periodEnd,
      leftTrend: trend,
      rightTrend: null,
    });
  }

  for (const trend of rightTrends.slice(-maxBuckets)) {
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
    .slice(-maxBuckets)
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

function formatWindow(
  fromDate: string | null,
  tillDate: string | null,
  requestedWindowDays: number,
): string {
  if (requestedWindowDays === -2) {
    return "All available history";
  }

  if (requestedWindowDays === -1) {
    return "Year to date";
  }

  if (!fromDate || !tillDate) {
    return "Latest visible range";
  }

  return `${formatDate(fromDate)} to ${formatDate(tillDate)}`;
}

function formatWindowOption(days: number): string {
  if (days === -1) {
    return "YTD";
  }

  if (days === -2) {
    return "All";
  }

  if (days === 1) {
    return "1D";
  }

  if (days === 7) {
    return "1W";
  }

  if (days === 30) {
    return "1M";
  }

  if (days === 90) {
    return "3M";
  }

  if (days === 180) {
    return "6M";
  }

  return `${days}d`;
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

"use client";

import { useState } from "react";

import type { DashboardSnapshot } from "@/lib/abaxx";
import {
  PRODUCT_RANKING_MODES,
  buildProductRankingRows,
  filterAndSortProductRankings,
  getProductRankingValue,
  type ProductPricingFilter,
  type ProductRankingMode,
  type ProductRankingRow,
} from "@/lib/product-rankings";

type ProductRankingsPanelProps = {
  drilldowns: DashboardSnapshot["productDrilldowns"];
  selectedProduct: string;
  leftProduct: string;
  rightProduct: string;
  onInspectProduct: (product: string) => void;
  onSetLeftProduct: (product: string) => void;
  onSetRightProduct: (product: string) => void;
  embedded?: boolean;
};

const integerFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
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

export function ProductRankingsPanel({
  drilldowns,
  selectedProduct,
  leftProduct,
  rightProduct,
  onInspectProduct,
  onSetLeftProduct,
  onSetRightProduct,
  embedded = false,
}: ProductRankingsPanelProps) {
  const [mode, setMode] = useState<ProductRankingMode>("absoluteVolume");
  const [market, setMarket] = useState("all");
  const [pricing, setPricing] = useState<ProductPricingFilter>("all");

  const rankingRows = buildProductRankingRows(drilldowns);
  const marketOptions = [...new Set(rankingRows.map((row) => row.marketLabel))].sort(
    (left, right) => left.localeCompare(right),
  );
  const filteredRows = filterAndSortProductRankings(rankingRows, {
    mode,
    market,
    pricing,
  });
  const modeDefinition =
    PRODUCT_RANKING_MODES.find((item) => item.id === mode) ?? PRODUCT_RANKING_MODES[0];
  const leader = filteredRows[0] ?? null;
  const pricedCount = filteredRows.filter((row) => row.pricingStatus === "priced").length;
  const unpricedCount = filteredRows.length - pricedCount;

  if (rankingRows.length === 0) {
    return null;
  }

  return (
    <section className={embedded ? "analysis-subpanel analysis-subpanel-rankings" : "dashboard-frame"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Product rankings</p>
          <h2>Rank products before you drill into them.</h2>
        </div>
        <p className="section-copy">
          {embedded
            ? "Filter the board, switch the ranking lens, and push a product directly into drilldown or either comparison side."
            : "The dashboard now supports the investor workflow that was still missing: filter the product set, change the ranking lens, and use normalized modes when dominant LNG lots would otherwise drown out smaller but denser products. Row actions now push the selected product directly into drilldown and comparison without reselecting it elsewhere."}
        </p>
      </div>

      <div className="ranking-control-grid">
        <label className="ranking-control-card">
          <span className="card-label">Ranking lens</span>
          <select
            aria-label="Ranking lens"
            className="ranking-select"
            value={mode}
            onChange={(event) =>
              setMode(event.currentTarget.value as ProductRankingMode)
            }
          >
            {PRODUCT_RANKING_MODES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p>{modeDefinition.description}</p>
        </label>

        <label className="ranking-control-card">
          <span className="card-label">Market filter</span>
          <select
            aria-label="Market filter"
            className="ranking-select"
            value={market}
            onChange={(event) => setMarket(event.currentTarget.value)}
          >
            <option value="all">All markets</option>
            {marketOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p>Keep the full board in view or isolate one market slice at a time.</p>
        </label>

        <label className="ranking-control-card">
          <span className="card-label">Pricing coverage</span>
          <select
            aria-label="Pricing coverage"
            className="ranking-select"
            value={pricing}
            onChange={(event) =>
              setPricing(event.currentTarget.value as ProductPricingFilter)
            }
          >
            <option value="all">All products</option>
            <option value="priced">Priced only</option>
            <option value="unpriced">Unpriced only</option>
          </select>
          <p>Separate products inside the current fee map from everything still outside it.</p>
        </label>
      </div>

      <div className="trend-stat-grid">
        <article className="trend-stat-card">
          <p className="card-label">Products in view</p>
          <strong>{integerFormatter.format(filteredRows.length)}</strong>
          <p>
            {market === "all" ? "Across the full surface." : `${market} only.`}{" "}
            {pricing === "all" ? "Both priced and unpriced products included." : null}
          </p>
        </article>
        <article className="trend-stat-card">
          <p className="card-label">Current leader</p>
          <strong>{leader?.product ?? "n/a"}</strong>
          <p>
            {leader
              ? `${formatScore(getProductRankingValue(leader, mode), modeDefinition.valueKind)} ${modeDefinition.scoreLabel.toLowerCase()}.`
              : "No products match the active filters."}
          </p>
        </article>
        <article className="trend-stat-card">
          <p className="card-label">Coverage mix</p>
          <strong>
            {integerFormatter.format(pricedCount)} / {integerFormatter.format(unpricedCount)}
          </strong>
          <p>Priced vs unpriced products in the current ranking view.</p>
        </article>
        <article className="trend-stat-card">
          <p className="card-label">Normalization</p>
          <strong>{modeDefinition.normalized ? "On" : "Off"}</strong>
          <p>
            {modeDefinition.normalized
              ? "Scores are divided by active contract count."
              : "Scores use absolute snapshot scale."}
          </p>
        </article>
      </div>

      {filteredRows.length > 0 ? (
        <div className="product-table-shell">
          <table className="product-table product-ranking-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Market</th>
                <th>Pricing</th>
                <th>Listed / active / marked</th>
                <th>Volume</th>
                <th>Open interest</th>
                <th>Base fees</th>
                <th>{modeDefinition.scoreLabel}</th>
                <th>Actions</th>
                <th>Investor read</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr
                  key={row.product}
                  className={row.product === selectedProduct ? "product-table-row-active" : undefined}
                >
                  <td className="ranking-table-rank">{index + 1}</td>
                  <td>
                    <div className="product-cell">
                      <strong>{row.product}</strong>
                      {!row.inCatalog ? (
                        <span className="product-flag">snapshot only</span>
                      ) : (
                        <span>{row.frontSymbol ?? "No visible front contract"}</span>
                      )}
                    </div>
                  </td>
                  <td>{row.marketLabel}</td>
                  <td>
                    <span
                      className={
                        row.pricingStatus === "priced"
                          ? "ranking-status-pill"
                          : "ranking-status-pill ranking-status-pill-unpriced"
                      }
                    >
                      {row.pricingGroup ?? "Unpriced"}
                    </span>
                  </td>
                  <td>
                    {integerFormatter.format(row.listedContracts)} /{" "}
                    {integerFormatter.format(row.activeContracts)} /{" "}
                    {integerFormatter.format(row.pricedContracts)}
                  </td>
                  <td>{integerFormatter.format(row.totalVolume)}</td>
                  <td>{integerFormatter.format(row.openInterest)}</td>
                  <td>
                    {row.latestEstimatedRevenue === null
                      ? "n/a"
                      : currencyFormatter.format(row.latestEstimatedRevenue)}
                  </td>
                  <td className="ranking-table-score">
                    {formatScore(
                      getProductRankingValue(row, mode),
                      modeDefinition.valueKind,
                    )}
                  </td>
                  <td>
                    <div className="ranking-action-group">
                      <button
                        type="button"
                        className={
                          row.product === selectedProduct
                            ? "ranking-action-button ranking-action-button-active"
                            : "ranking-action-button"
                        }
                        onClick={() => onInspectProduct(row.product)}
                      >
                        {row.product === selectedProduct ? "Inspecting" : "Inspect"}
                      </button>
                      <button
                        type="button"
                        className={
                          row.product === leftProduct
                            ? "ranking-action-button ranking-action-button-active"
                            : "ranking-action-button"
                        }
                        onClick={() => onSetLeftProduct(row.product)}
                      >
                        {row.product === leftProduct ? "Left set" : "Set left"}
                      </button>
                      <button
                        type="button"
                        className={
                          row.product === rightProduct
                            ? "ranking-action-button ranking-action-button-active"
                            : "ranking-action-button"
                        }
                        onClick={() => onSetRightProduct(row.product)}
                      >
                        {row.product === rightProduct ? "Right set" : "Set right"}
                      </button>
                    </div>
                  </td>
                  <td className="ranking-context">{describeRow(row, mode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface-note">
          <p>No products match the current market and pricing filters.</p>
        </div>
      )}
    </section>
  );
}

function formatScore(
  value: number | null,
  valueKind: "integer" | "currency" | "decimal",
): string {
  if (value === null) {
    return "n/a";
  }

  switch (valueKind) {
    case "currency":
      return currencyFormatter.format(value);
    case "decimal":
      return decimalFormatter.format(value);
    case "integer":
    default:
      return integerFormatter.format(value);
  }
}

function describeRow(row: ProductRankingRow, mode: ProductRankingMode): string {
  switch (mode) {
    case "absoluteVolume":
      return `${integerFormatter.format(row.totalVolume)} latest lots across ${integerFormatter.format(row.activeContracts)} active contracts.`;
    case "absoluteOpenInterest":
      return `${integerFormatter.format(row.openInterest)} open interest on the latest snapshot.`;
    case "modeledFees":
      return row.latestEstimatedRevenue === null
        ? "Visible product, but still outside the base fee schedule."
        : `${formatPercent(row.revenueShare)} of base modeled daily fees.`;
    case "volumePerActiveContract":
      return row.volumePerActiveContract === null
        ? "No active contracts to normalize against."
        : `${decimalFormatter.format(row.volumePerActiveContract)} lots per active contract.`;
    case "openInterestPerActiveContract":
      return row.openInterestPerActiveContract === null
        ? "No active contracts to normalize against."
        : `${decimalFormatter.format(row.openInterestPerActiveContract)} OI per active contract.`;
    case "feesPerActiveContract":
      return row.feesPerActiveContract === null
        ? "No active priced contracts to normalize against."
        : `${currencyFormatter.format(row.feesPerActiveContract)} modeled fees per active contract.`;
    default:
      return `${integerFormatter.format(row.totalVolume)} latest lots.`;
  }
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${percentFormatter.format(value)}%`;
}

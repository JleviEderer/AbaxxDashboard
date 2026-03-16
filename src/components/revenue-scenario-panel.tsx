"use client";

import { useMemo, useState } from "react";

import type { DashboardSnapshot } from "@/lib/abaxx";
import { LineChartCard } from "@/components/line-chart-card";
import {
  REVENUE_SCENARIO_PRESETS,
  buildScenarioFeeMap,
  computeRevenueScenario,
  type RevenueScenarioPresetId,
} from "@/lib/revenue-scenarios";

type RevenueScenarioPanelProps = {
  revenueModel: DashboardSnapshot["revenueModel"];
  snapshotAsOf: string | null;
};

const integerFormatter = new Intl.NumberFormat("en-US");
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

export function RevenueScenarioPanel({
  revenueModel,
  snapshotAsOf,
}: RevenueScenarioPanelProps) {
  const [activePresetId, setActivePresetId] = useState<
    RevenueScenarioPresetId | "custom"
  >("base");
  const [feesByAssumptionId, setFeesByAssumptionId] = useState(() =>
    buildScenarioFeeMap(revenueModel.assumptions, "base"),
  );

  const scenario = useMemo(
    () => computeRevenueScenario(revenueModel, feesByAssumptionId),
    [feesByAssumptionId, revenueModel],
  );
  const revenueWeeklyTrends = scenario.weeklyTrends.slice(-6);
  const latestRevenueWeek = revenueWeeklyTrends.at(-1) ?? null;
  const previousRevenueWeek = revenueWeeklyTrends.at(-2) ?? null;
  const revenueProductRows = scenario.productSummaries
    .filter((summary) => summary.latestEstimatedRevenue !== null)
    .slice(0, 6);
  const activeScenarioLabel =
    activePresetId === "custom"
      ? "Custom"
      : (REVENUE_SCENARIO_PRESETS.find((preset) => preset.id === activePresetId)?.label ??
        "Base");

  return (
    <section id="revenue-model" className="dashboard-frame dashboard-frame-revenue">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Revenue scenarios</p>
          <h2>Stress the fee model without contaminating observed market data.</h2>
        </div>
        <p className="section-copy">
          Observed volume stays fixed. This panel only changes the modeled fee
          assumptions layered on top. Presets shift every pricing group by 20%
          down or up from the current schedule, and each group can then be edited
          directly.
        </p>
      </div>

      <div className="model-boundary-grid">
        <article className="model-boundary-card">
          <p className="card-label">Observed input</p>
          <strong>{integerFormatter.format(scenario.latestTotalVolume)} latest lots</strong>
          <p>
            Volume and open interest remain fixed from the market snapshot on{" "}
            {formatDate(snapshotAsOf)}.
          </p>
        </article>
        <article className="model-boundary-card model-boundary-card-accent">
          <p className="card-label">Modeled layer</p>
          <strong>{activeScenarioLabel}</strong>
          <p>
            Scenario changes only flow through fee assumptions and the resulting
            revenue distribution.
          </p>
        </article>
      </div>

      <div className="scenario-control-grid">
        <div className="scenario-preset-row" role="tablist" aria-label="Revenue scenario presets">
          {REVENUE_SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                activePresetId === preset.id
                  ? "scenario-pill scenario-pill-active"
                  : "scenario-pill"
              }
              onClick={() => {
                setActivePresetId(preset.id);
                setFeesByAssumptionId(buildScenarioFeeMap(revenueModel.assumptions, preset.id));
              }}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
          <div className="scenario-status-card">
            <p className="card-label">Live mode</p>
            <strong>{activeScenarioLabel}</strong>
            <p>
              Inputs update modeled fees, run-rates, and product shares in place.
            </p>
          </div>
        </div>

        <div className="scenario-input-grid">
          {scenario.assumptions.map((assumption) => (
            <label key={assumption.id} className="scenario-input-card">
              <span className="scenario-input-label">
                <strong>{assumption.label}</strong>
                <span>{assumption.products.join(", ")}</span>
              </span>
              <span className="scenario-input-shell">
                <span className="scenario-input-prefix">$</span>
                <input
                  className="scenario-input"
                  type="number"
                  min="0"
                  step="0.05"
                  value={feesByAssumptionId[assumption.id] ?? assumption.feePerSide}
                  onChange={(event) => {
                    const nextValue = Number(event.currentTarget.value);
                    setActivePresetId("custom");
                    setFeesByAssumptionId((current) => ({
                      ...current,
                      [assumption.id]: Number.isFinite(nextValue) ? nextValue : 0,
                    }));
                  }}
                />
              </span>
              <span className="scenario-input-note">per side / lot</span>
            </label>
          ))}
        </div>
      </div>

      <div className="trend-stat-grid">
        <article className="trend-stat-card">
          <p className="card-label">Modeled daily fees</p>
          <strong>{formatCurrency(scenario.latestEstimatedRevenue)}</strong>
          <p>Gross estimate from the latest priced snapshot on {formatDate(snapshotAsOf)}.</p>
        </article>
        <article className="trend-stat-card">
          <p className="card-label">Latest weekly fees</p>
          <strong>{formatCurrency(scenario.latestWeekRevenue)}</strong>
          <p>
            {formatCurrencyChange(
              latestRevenueWeek?.estimatedRevenue ?? 0,
              previousRevenueWeek?.estimatedRevenue,
              "vs prior week",
            )}
          </p>
        </article>
        <article className="trend-stat-card">
          <p className="card-label">Annualized run-rate</p>
          <strong>{formatCurrency(scenario.annualizedRunRate)}</strong>
          <p>
            {formatCurrency(scenario.quarterlyRunRate)} quarterly run-rate if the
            latest visible week repeats.
          </p>
        </article>
        <article className="trend-stat-card">
          <p className="card-label">Priced volume coverage</p>
          <strong>{formatPercent(scenario.latestVolumeCoverage)}</strong>
          <p>
            {integerFormatter.format(scenario.latestModeledVolume)} of{" "}
            {integerFormatter.format(scenario.latestTotalVolume)} latest snapshot lots
            remain inside the explicit fee schedule.
          </p>
        </article>
      </div>

      <div className="slice-grid">
        <LineChartCard
          eyebrow="Scenario chart"
          title="Weekly modeled fee revenue"
          meta="Formula: volume x selected fee x 2 with observed volume unchanged"
          ariaLabel="Weekly modeled fee revenue by scenario"
          points={revenueWeeklyTrends.map((trend) => ({
            label: shortRange(trend.periodStart, trend.periodEnd),
            value: trend.estimatedRevenue,
            note: `${integerFormatter.format(trend.pricedProducts)} priced`,
          }))}
          valueFormatter={formatCurrency}
        />
        <article className="slice-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Scenario inputs</p>
              <h3>Fee schedule now in force</h3>
            </div>
            <p className="panel-meta">
              Presets are shortcuts. Inputs below are the authoritative model state.
            </p>
          </div>

          <div className="market-summary-list">
            {scenario.assumptions.map((assumption) => (
              <div key={assumption.id} className="market-summary-item">
                <div>
                  <strong>{assumption.label}</strong>
                  <p>{assumption.products.join(", ")}</p>
                </div>
                <div className="market-summary-metrics">
                  <span>{formatCurrency(assumption.feePerSide)}</span>
                  <span>per side / lot</span>
                </div>
              </div>
            ))}
          </div>

          <div className="surface-note">
            <p>
              The precious-metals mapping still follows live feed code `GKS`, even
              though the earlier source image appeared to say `GXS`.
            </p>
            {scenario.unpricedProducts.length > 0 ? (
              <p>
                Active or visible products still outside the modeled schedule:{" "}
                {scenario.unpricedProducts.join(", ")}.
              </p>
            ) : (
              <p>No active latest-snapshot products currently sit outside the model.</p>
            )}
          </div>
        </article>
      </div>

      <div className="product-table-shell">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Pricing group</th>
              <th>Fee per side</th>
              <th>Latest volume</th>
              <th>Latest OI</th>
              <th>Modeled daily fees</th>
              <th>Revenue share</th>
            </tr>
          </thead>
          <tbody>
            {revenueProductRows.map((summary) => (
              <tr key={summary.product}>
                <td>{summary.product}</td>
                <td>{summary.pricingGroup ?? "Unpriced"}</td>
                <td>
                  {summary.feePerSide === null ? "n/a" : formatCurrency(summary.feePerSide)}
                </td>
                <td>{integerFormatter.format(summary.latestVolume)}</td>
                <td>{integerFormatter.format(summary.latestOpenInterest)}</td>
                <td>
                  {summary.latestEstimatedRevenue === null
                    ? "n/a"
                    : formatCurrency(summary.latestEstimatedRevenue)}
                </td>
                <td>{formatPercent(summary.revenueShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
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

function formatCurrencyChange(
  current: number,
  previous: number | undefined,
  suffix: string,
): string {
  if (previous === undefined) {
    return "First visible week in the current trend window.";
  }

  const delta = current - previous;
  if (delta === 0) {
    return `Flat ${suffix}.`;
  }

  return `${delta > 0 ? "+" : "-"}${formatCurrency(Math.abs(delta))} ${suffix}.`;
}

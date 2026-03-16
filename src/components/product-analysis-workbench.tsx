"use client";

import { useState } from "react";

import type { DashboardSnapshot } from "@/lib/abaxx";
import { ProductComparisonPanel } from "@/components/product-comparison-panel";
import { ProductDrilldownPanel } from "@/components/product-drilldown-panel";
import { ProductRankingsPanel } from "@/components/product-rankings-panel";

type ProductAnalysisWorkbenchProps = {
  drilldowns: DashboardSnapshot["productDrilldowns"];
  snapshotAsOf: string | null;
  settlementAsOf: string | null;
  selectedProduct?: string;
  leftProduct?: string;
  rightProduct?: string;
  onSelectedProductChange?: (product: string) => void;
  onLeftProductChange?: (product: string) => void;
  onRightProductChange?: (product: string) => void;
};

export function ProductAnalysisWorkbench({
  drilldowns,
  snapshotAsOf,
  settlementAsOf,
  selectedProduct,
  leftProduct,
  rightProduct,
  onSelectedProductChange,
  onLeftProductChange,
  onRightProductChange,
}: ProductAnalysisWorkbenchProps) {
  const defaultSelected =
    drilldowns.find((item) => item.totalVolume > 0 || item.openInterest > 0)?.product ??
    drilldowns[0]?.product ??
    "";
  const defaultRight =
    drilldowns.find((item) => item.product !== defaultSelected)?.product ?? defaultSelected;

  const [internalSelectedProduct, setInternalSelectedProduct] = useState(defaultSelected);
  const [internalLeftProduct, setInternalLeftProduct] = useState(defaultSelected);
  const [internalRightProduct, setInternalRightProduct] = useState(defaultRight);

  const currentSelectedProduct = selectedProduct ?? internalSelectedProduct;
  const currentLeftProduct = leftProduct ?? internalLeftProduct;
  const currentRightProduct = rightProduct ?? internalRightProduct;
  const setSelectedProduct = onSelectedProductChange ?? setInternalSelectedProduct;
  const setLeftProduct = onLeftProductChange ?? setInternalLeftProduct;
  const setRightProduct = onRightProductChange ?? setInternalRightProduct;

  const resolvedSelected =
    resolveProduct(drilldowns, currentSelectedProduct) ?? defaultSelected;
  const resolvedLeft = resolveProduct(drilldowns, currentLeftProduct) ?? resolvedSelected;
  const resolvedRight =
    resolveProduct(drilldowns, currentRightProduct) ??
    drilldowns.find((item) => item.product !== resolvedLeft)?.product ??
    resolvedLeft;
  const selected =
    drilldowns.find((item) => item.product === resolvedSelected) ?? drilldowns[0] ?? null;
  const left = drilldowns.find((item) => item.product === resolvedLeft) ?? selected;
  const right =
    drilldowns.find((item) => item.product === resolvedRight) ??
    drilldowns.find((item) => item.product !== left?.product) ??
    left;

  if (drilldowns.length === 0) {
    return null;
  }

  return (
    <section id="workflow" className="dashboard-frame analysis-studio">
      <div className="section-heading analysis-studio-heading">
        <div>
          <p className="eyebrow">Product workflow</p>
          <h2>Rank the surface, inspect one winner, then pressure-test it against a peer.</h2>
        </div>
        <p className="section-copy">
          The workflow is now coordinated instead of split across disconnected panels.
          Rankings drive the active drilldown and both comparison slots, so the page
          behaves more like one analysis system and less like a stack of separate tools.
        </p>
      </div>

      <div className="analysis-studio-status">
        <article className="analysis-status-card">
          <p className="card-label">Inspecting</p>
          <strong>{selected?.product ?? "n/a"}</strong>
          <p>
            {selected?.market ?? "Unassigned"} market, front {selected?.frontSymbol ?? "n/a"}.
          </p>
        </article>
        <article className="analysis-status-card">
          <p className="card-label">Comparison left</p>
          <strong>{left?.product ?? "n/a"}</strong>
          <p>{left?.latestEstimatedRevenue === null ? "Base model unpriced." : "Included in fee model."}</p>
        </article>
        <article className="analysis-status-card">
          <p className="card-label">Comparison right</p>
          <strong>{right?.product ?? "n/a"}</strong>
          <p>{right?.latestEstimatedRevenue === null ? "Base model unpriced." : "Included in fee model."}</p>
        </article>
        <article className="analysis-status-card analysis-status-card-accent">
          <p className="card-label">Workflow note</p>
          <strong>Row actions stay in sync</strong>
          <p>Use rankings to push products straight into drilldown or either comparison side.</p>
        </article>
      </div>

      <ProductRankingsPanel
        drilldowns={drilldowns}
        selectedProduct={resolvedSelected}
        leftProduct={resolvedLeft}
        rightProduct={resolvedRight}
        onInspectProduct={(product) => setSelectedProduct(product)}
        onSetLeftProduct={(product) => {
          setSelectedProduct(product);
          setLeftProduct(product);
        }}
        onSetRightProduct={(product) => {
          setSelectedProduct(product);
          setRightProduct(product);
        }}
        embedded
      />

      <div className="analysis-detail-grid">
        <ProductDrilldownPanel
          drilldowns={drilldowns}
          snapshotAsOf={snapshotAsOf}
          settlementAsOf={settlementAsOf}
          selectedProduct={resolvedSelected}
          onSelectProduct={setSelectedProduct}
          embedded
        />

        <ProductComparisonPanel
          drilldowns={drilldowns}
          leftProduct={resolvedLeft}
          rightProduct={resolvedRight}
          onLeftProductChange={setLeftProduct}
          onRightProductChange={setRightProduct}
          embedded
        />
      </div>
    </section>
  );
}

function resolveProduct(
  drilldowns: DashboardSnapshot["productDrilldowns"],
  product: string | null,
): string | null {
  if (!product) {
    return null;
  }

  return drilldowns.some((item) => item.product === product) ? product : null;
}

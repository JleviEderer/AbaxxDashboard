"use client";

import { useState, useTransition } from "react";
import {
  buildInstrumentsUrl,
  buildProductsUrl,
  normalizeInstruments,
  normalizeProducts,
  type ProductRecord,
} from "@/lib/abaxx";

type ProofState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      products: ProductRecord[];
      sourceUrl: string;
      firstProductInstruments: number;
      firstProductId: string | null;
    };

type ServerProofState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      ok: boolean;
      statusCode: number | null;
      sourceUrl: string;
      contentType: string | null;
      normalizedCount: number;
      firstProduct: string | null;
      firstProductInstruments: number;
      bodyPreview: string | null;
      error?: string;
    };

export function MarketProofPanel() {
  const [proofState, setProofState] = useState<ProofState>({ status: "idle" });
  const [serverProofState, setServerProofState] = useState<ServerProofState>({
    status: "idle",
  });
  const [isPending, startTransition] = useTransition();

  const runProof = () => {
    const sourceUrl = buildProductsUrl();

    startTransition(async () => {
      setProofState({ status: "loading" });

      try {
        const response = await fetch(sourceUrl, {
          headers: {
            accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        const products = normalizeProducts(payload);
        let firstProductInstruments = 0;
        const firstProductId = products[0]?.id ?? null;

        if (firstProductId) {
          const instrumentsResponse = await fetch(buildInstrumentsUrl(firstProductId), {
            headers: {
              accept: "application/json",
            },
          });

          if (instrumentsResponse.ok) {
            const instrumentsPayload = (await instrumentsResponse.json()) as unknown;
            firstProductInstruments = normalizeInstruments(instrumentsPayload).length;
          }
        }

        setProofState({
          status: "success",
          products,
          sourceUrl,
          firstProductInstruments,
          firstProductId,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown request failure";

        setProofState({
          status: "error",
          message,
        });
      }
    });
  };

  const runServerProof = () => {
    startTransition(async () => {
      setServerProofState({ status: "loading" });

      try {
        const response = await fetch("/api/proof/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Proof route failed with ${response.status}`);
        }

        const payload = (await response.json()) as {
          ok: boolean;
          status: number | null;
          sourceUrl: string;
          contentType: string | null;
          normalizedCount: number;
          firstProduct: string | null;
          firstProductInstruments: number;
          bodyPreview: string | null;
          error?: string;
        };

        setServerProofState({
          status: "success",
          ok: payload.ok,
          statusCode: payload.status,
          sourceUrl: payload.sourceUrl,
          contentType: payload.contentType,
          normalizedCount: payload.normalizedCount,
          firstProduct: payload.firstProduct,
          firstProductInstruments: payload.firstProductInstruments,
          bodyPreview: payload.bodyPreview,
          error: payload.error,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown proof route failure";

        setServerProofState({
          status: "error",
          message,
        });
      }
    });
  };

  return (
    <section className="proof-panel">
      <div className="proof-header">
        <div>
          <p className="eyebrow">Browser-context proof</p>
          <h2>Probe the public products endpoint from the app runtime.</h2>
        </div>

        <div className="proof-actions">
          <button className="proof-button" onClick={runProof} disabled={isPending}>
            {proofState.status === "loading" || isPending
              ? "Running proof..."
              : "Run browser proof"}
          </button>
          <button
            className="proof-button proof-button-secondary"
            onClick={runServerProof}
            disabled={isPending}
          >
            {serverProofState.status === "loading" || isPending
              ? "Running proof..."
              : "Run server proof"}
          </button>
        </div>
      </div>

      <p className="proof-copy">
        This request intentionally runs in the browser against the public
        `abaxx.exchange/api` surface. It answers the first real question for the
        build: can the app access the public API directly enough to support the MVP?
      </p>

      {proofState.status === "idle" ? (
        <div className="proof-output">
          <p>No live request has been attempted yet.</p>
        </div>
      ) : null}

      {proofState.status === "loading" ? (
        <div className="proof-output">
          <p>Requesting live data from the browser context...</p>
        </div>
      ) : null}

      {proofState.status === "error" ? (
        <div className="proof-output proof-output-error">
          <p className="proof-output-label">Request failed</p>
          <p>{proofState.message}</p>
        </div>
      ) : null}

      {proofState.status === "success" ? (
        <div className="proof-output">
          <p className="proof-output-label">Live request succeeded</p>
          <p className="proof-meta">{proofState.sourceUrl}</p>
          <p>
            {proofState.products.length > 0
              ? `Normalized ${proofState.products.length} product records.`
              : "The request returned data, but normalization found no product-shaped records yet."}
          </p>
          {proofState.firstProductId ? (
            <p>
              First product: {proofState.firstProductId}. Instruments loaded:{" "}
              {proofState.firstProductInstruments}.
            </p>
          ) : null}

          {proofState.products.length > 0 ? (
            <ul className="proof-list">
              {proofState.products.slice(0, 5).map((product) => (
                <li key={product.id}>
                  <span>{product.id}</span>
                  <p>{product.label}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="proof-divider" />

      <p className="proof-copy">
        The server proof checks the same public API from Next.js server context. This
        tells us whether a lightweight proxy or cache layer is feasible without
        touching the blocked raw backend host.
      </p>

      {serverProofState.status === "idle" ? (
        <div className="proof-output">
          <p>No server-side proof has been attempted yet.</p>
        </div>
      ) : null}

      {serverProofState.status === "loading" ? (
        <div className="proof-output">
          <p>Running server-side proof route...</p>
        </div>
      ) : null}

      {serverProofState.status === "error" ? (
        <div className="proof-output proof-output-error">
          <p className="proof-output-label">Proof route failed</p>
          <p>{serverProofState.message}</p>
        </div>
      ) : null}

      {serverProofState.status === "success" ? (
        <div
          className={`proof-output ${
            serverProofState.ok ? "" : "proof-output-error"
          }`}
        >
          <p className="proof-output-label">
            {serverProofState.ok ? "Server proof succeeded" : "Server proof did not succeed"}
          </p>
          <p className="proof-meta">{serverProofState.sourceUrl}</p>
          <p>
            Status:{" "}
            {serverProofState.statusCode === null
              ? "request error"
              : serverProofState.statusCode}
          </p>
          <p>Content type: {serverProofState.contentType ?? "unknown"}</p>
          <p>Normalized records: {serverProofState.normalizedCount}</p>
          {serverProofState.firstProduct ? (
            <p>
              First product: {serverProofState.firstProduct}. Instruments loaded:{" "}
              {serverProofState.firstProductInstruments}.
            </p>
          ) : null}
          {serverProofState.error ? <p>Error: {serverProofState.error}</p> : null}
          {serverProofState.bodyPreview ? (
            <pre className="proof-preview">{serverProofState.bodyPreview}</pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

import { ProductsDashboardSlice } from "@/components/products-dashboard-slice";
import {
  fetchDashboardSnapshot,
  resolveSnapshotNow,
  type DashboardSnapshot,
} from "@/lib/abaxx";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const WINDOW_OPTIONS = [1, 7, 30, 90, 180, -1, -2];

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const defaultAsOf = formatIsoDate(resolveSnapshotNow());
  const requestedAsOf = resolveRequestedAsOf(
    pickFirstValue(resolvedSearchParams.asof),
    defaultAsOf,
  );
  const requestedWindowDays = resolveRequestedWindowDays(
    pickFirstValue(resolvedSearchParams.window),
  );
  const resolvedWindowDays =
    requestedWindowDays === -1
      ? computeYtdDays(requestedAsOf)
      : requestedWindowDays === -2
        ? computeAllHistoryDays(requestedAsOf)
      : requestedWindowDays;
  const asOfOptions = buildRecentIsoDates(requestedAsOf, 7);

  let snapshot: DashboardSnapshot | null = null;
  let snapshotError: string | null = null;

  try {
    snapshot = await fetchDashboardSnapshot({
      now: new Date(`${requestedAsOf}T12:00:00Z`),
      trendLookbackDays: resolvedWindowDays,
    });
  } catch (error) {
    snapshotError =
      error instanceof Error ? error.message : "Unknown market-data load failure.";
  }

  return (
    <main className="page-shell page-shell-workspace">
      {snapshot ? (
        <ProductsDashboardSlice
          snapshot={snapshot}
          requestedAsOf={requestedAsOf}
          requestedWindowDays={requestedWindowDays}
          asOfOptions={asOfOptions}
          windowOptions={WINDOW_OPTIONS}
        />
      ) : (
        <section className="workspace-error-panel">
          <p className="eyebrow">Snapshot status</p>
          <h1>Abaxx market workspace is offline.</h1>
          <p>
            {snapshotError ??
              "The dashboard could not load the current public market snapshot."}
          </p>
          <div className="workspace-error-actions">
            <span className="workspace-badge">Data fetch failed</span>
            <span className="workspace-badge workspace-badge-muted">
              Retry after the public surface responds again
            </span>
          </div>
        </section>
      )}
    </main>
  );
}

function pickFirstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function resolveRequestedAsOf(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function resolveRequestedWindowDays(value: string | null): number {
  const parsed = Number(value);
  return WINDOW_OPTIONS.includes(parsed) ? parsed : 90;
}

function computeYtdDays(asOf: string): number {
  const date = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return 90;
  }

  const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date.getTime() - jan1.getTime();
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1, 1);
}

function computeAllHistoryDays(asOf: string): number {
  const date = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return 365;
  }

  // Request from far enough back that the API returns all available history.
  const floor = new Date(Date.UTC(2000, 0, 1));
  const diffMs = date.getTime() - floor.getTime();
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1, 1);
}

function buildRecentIsoDates(anchorDate: string, days: number): string[] {
  const date = new Date(`${anchorDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return [anchorDate];
  }

  return Array.from({ length: days }, (_, index) => {
    const next = new Date(date);
    next.setUTCDate(date.getUTCDate() - index);
    return formatIsoDate(next);
  });
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

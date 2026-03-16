import { ProductsDashboardSlice } from "@/components/products-dashboard-slice";
import {
  fetchDashboardSnapshot,
  resolveSnapshotNow,
  type DashboardSnapshot,
} from "@/lib/abaxx";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const WINDOW_OPTIONS = [14, 28, 42, 84];

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
  const asOfOptions = buildRecentIsoDates(requestedAsOf, 7);

  let snapshot: DashboardSnapshot | null = null;
  let snapshotError: string | null = null;

  try {
    snapshot = await fetchDashboardSnapshot({
      now: new Date(`${requestedAsOf}T12:00:00Z`),
      trendLookbackDays: requestedWindowDays,
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
  return WINDOW_OPTIONS.includes(parsed) ? parsed : 42;
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

import type { DashboardSnapshot } from "@/lib/abaxx";
import { DashboardWorkspace } from "@/components/dashboard-workspace";

type ProductsDashboardSliceProps = {
  snapshot: DashboardSnapshot;
  requestedAsOf: string;
  requestedWindowDays: number;
  asOfOptions: string[];
  windowOptions: number[];
};

export function ProductsDashboardSlice({
  snapshot,
  requestedAsOf,
  requestedWindowDays,
  asOfOptions,
  windowOptions,
}: ProductsDashboardSliceProps) {
  return (
    <DashboardWorkspace
      snapshot={snapshot}
      requestedAsOf={requestedAsOf}
      requestedWindowDays={requestedWindowDays}
      asOfOptions={asOfOptions}
      windowOptions={windowOptions}
    />
  );
}

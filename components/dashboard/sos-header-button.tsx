"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSosAlerts } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { SOS_REFETCH_INTERVAL } from "@/lib/sos";
import { cn } from "@/lib/utils";

/**
 * Header shortcut to the SOS alerts page, badged with the number of alerts
 * still awaiting acknowledgment.
 *
 * Shares its query key with the SOS popup, so the two read one cached result
 * instead of polling the backend twice.
 */
export function SosHeaderButton() {
  const pendingQuery = useQuery({
    queryKey: QUERY_KEYS.sosAlerts("pending"),
    queryFn: () => getSosAlerts({ status: "pending", limit: 20 }),
    refetchInterval: SOS_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  const pendingCount = pendingQuery.data?.pagination?.total ?? 0;
  const hasPending = pendingCount > 0;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "relative size-10 rounded-xl",
        hasPending
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-secondary-bg text-secondary-text hover:bg-secondary-hover"
      )}
      aria-label={
        hasPending
          ? `SOS alerts: ${pendingCount} awaiting acknowledgment`
          : "SOS alerts"
      }
      title="SOS Alerts"
    >
      <Link href="/sos-alerts">
        <TriangleAlert className={cn("size-5", hasPending && "animate-pulse")} />

        {hasPending ? (
          <span className="absolute -top-1 -right-1 flex min-w-[18px] items-center justify-center rounded-full border-2 border-header-bg bg-red-600 px-1 text-[10px] leading-4 font-bold text-white">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, MapPin, TriangleAlert, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { acknowledgeSosAlert, getApiMessage, getSosAlerts } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  SOS_REFETCH_INTERVAL,
  getSosLocationLabel,
  getSosTriggeredLabel,
} from "@/lib/sos";

// Dismissing without acknowledging only hides the alert briefly: an
// unacknowledged emergency must come back.
const SNOOZE_DURATION = 2 * 60 * 1000;

/**
 * Watches for unacknowledged SOS alerts and interrupts the admin with a dialog.
 *
 * The web dashboard cannot receive push notifications, so this relies on the
 * dashboard being open and polling.
 */
export function SosAlertWatcher() {
  const queryClient = useQueryClient();
  const [snoozedIds, setSnoozedIds] = useState<Record<string, boolean>>({});
  const snoozeTimersRef = useRef<number[]>([]);

  useEffect(
    () => () => {
      snoozeTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId)
      );
      snoozeTimersRef.current = [];
    },
    []
  );

  const sosQuery = useQuery({
    queryKey: QUERY_KEYS.sosAlerts("pending"),
    queryFn: () => getSosAlerts({ status: "pending", limit: 20 }),
    refetchInterval: SOS_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeSosAlert,
    onSuccess: (response) => {
      toast.success(response.message || "SOS alert acknowledged");
      queryClient.invalidateQueries({ queryKey: ["sos-alerts"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to acknowledge this SOS alert"));
    },
  });

  const pendingAlerts = sosQuery.data?.alerts;

  const visibleAlerts = useMemo(
    () => (pendingAlerts ?? []).filter((alert) => !snoozedIds[alert._id]),
    [pendingAlerts, snoozedIds]
  );

  const isOpen = visibleAlerts.length > 0;

  const handleSnoozeAll = () => {
    const snoozedNow = visibleAlerts.map((alert) => alert._id);
    if (!snoozedNow.length) {
      return;
    }

    setSnoozedIds((previous) => {
      const next = { ...previous };
      snoozedNow.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    // An unacknowledged emergency must come back on its own.
    const timerId = window.setTimeout(() => {
      setSnoozedIds((previous) => {
        const next = { ...previous };
        snoozedNow.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    }, SNOOZE_DURATION);

    snoozeTimersRef.current.push(timerId);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleSnoozeAll();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[560px] border-2 border-red-600 p-0"
      >
        <DialogHeader className="items-center gap-2 border-b border-border bg-red-600 px-6 py-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white">
            <TriangleAlert className="size-8" />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-white">
            SOS Emergency Alert
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-white/90">
            {visibleAlerts.length === 1
              ? "A guard has triggered an SOS and is waiting for a response."
              : `${visibleAlerts.length} guards have triggered an SOS and are waiting for a response.`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] space-y-3 overflow-y-auto px-6 py-4">
          {visibleAlerts.map((alert) => {
            const location = getSosLocationLabel(alert);
            const isAcknowledging =
              acknowledgeMutation.isPending &&
              acknowledgeMutation.variables === alert._id;

            return (
              <div
                key={alert._id}
                className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-950/30"
              >
                <div className="flex items-start gap-2 text-sm font-semibold text-text-primary">
                  <UserIcon className="mt-0.5 size-4 shrink-0 text-red-600" />
                  <span>
                    {alert.user?.name || "Unknown user"}
                    {alert.user?.userId ? ` (${alert.user.userId})` : ""}
                  </span>
                </div>

                <div className="mt-2 flex items-start gap-2 text-xs text-text-secondary">
                  <Clock className="mt-0.5 size-3.5 shrink-0" />
                  <span>{getSosTriggeredLabel(alert)}</span>
                </div>

                <div className="mt-1.5 flex items-start gap-2 text-xs text-text-secondary">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {location ? (
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                    >
                      {location.text}
                    </a>
                  ) : (
                    <span>Location unavailable</span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  className="mt-3 w-full font-semibold"
                  disabled={isAcknowledging}
                  onClick={() => acknowledgeMutation.mutate(alert._id)}
                >
                  {isAcknowledging ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Acknowledge (I&apos;m Aware)
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="min-w-[160px]"
            onClick={handleSnoozeAll}
          >
            Remind me in 2 minutes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

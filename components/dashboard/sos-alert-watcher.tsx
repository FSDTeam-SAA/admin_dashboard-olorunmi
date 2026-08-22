"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// How long the alert tone plays before fading out on its own, in seconds.
const ALERT_SOUND_DURATION = 20;

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
  const audioContextRef = useRef<AudioContext | null>(null);
  // The one tone currently sounding. Every stop path goes through this single
  // ref, and `token` identifies which play owns it, so a previous oscillator
  // finishing can never clear the handle belonging to a newer one.
  const activeSoundRef = useRef<{
    token: number;
    oscillator: OscillatorNode;
    gain: GainNode;
  } | null>(null);
  const playTokenRef = useRef(0);
  // Guard ids already accounted for by a play/replay, so re-renders and
  // already-listed guards don't retrigger the tone — only a genuinely new id.
  const seenAlertIdsRef = useRef<Set<string>>(new Set());

  // Only one instance of the tone should ever be audible at once, so any
  // in-progress play is torn down before a new one starts.
  const stopAlertSound = useCallback(() => {
    const active = activeSoundRef.current;
    if (!active) {
      return;
    }

    activeSoundRef.current = null;

    try {
      // Detach before stopping: a stale `onended` firing after a newer play
      // has started is exactly what used to orphan the newer oscillator.
      active.oscillator.onended = null;
      active.oscillator.stop();
    } catch {
      // Already stopped/ended — nothing to do.
    }

    try {
      active.oscillator.disconnect();
      active.gain.disconnect();
    } catch {
      // Already disconnected.
    }
  }, []);

  // A short two-tone siren synthesized with the Web Audio API — avoids
  // depending on a licensed sound asset, and gives precise start/stop control
  // so it can be cut off the instant an alert is acknowledged.
  const playAlertSound = useCallback(() => {
    stopAlertSound();

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const toggleInterval = 0.3;
      const toggleCount = Math.floor(ALERT_SOUND_DURATION / toggleInterval);
      for (let i = 0; i < toggleCount; i++) {
        oscillator.frequency.setValueAtTime(
          i % 2 === 0 ? 880 : 660,
          now + i * toggleInterval
        );
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + ALERT_SOUND_DURATION - 0.2);
      gain.gain.linearRampToValueAtTime(0, now + ALERT_SOUND_DURATION);

      const token = playTokenRef.current + 1;
      playTokenRef.current = token;

      oscillator.onended = () => {
        // Clear the shared handle only while this play still owns it.
        if (activeSoundRef.current?.token === token) {
          activeSoundRef.current = null;
        }

        try {
          oscillator.disconnect();
          gain.disconnect();
        } catch {
          // Already disconnected.
        }
      };

      activeSoundRef.current = { token, oscillator, gain };

      oscillator.start(now);
      oscillator.stop(now + ALERT_SOUND_DURATION);

      // Some browsers start contexts suspended until a user gesture; resuming
      // is safe to call even when already running, and any rejection here
      // (blocked autoplay) must never surface as an unhandled error.
      void ctx.resume?.().catch(() => {});
    } catch {
      // Web Audio can be unavailable/blocked in some environments — the SOS
      // dialog itself must keep working regardless.
    }
  }, [stopAlertSound]);

  useEffect(
    () => () => {
      snoozeTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId)
      );
      snoozeTimersRef.current = [];

      // Last-resort safeguard: nothing may outlive this component still making
      // noise with no reference left to stop it.
      stopAlertSound();
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      void ctx?.close?.().catch(() => {});
    },
    [stopAlertSound]
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

  // Play the alert tone whenever a guard id we haven't already seen shows up
  // in the visible list — the dialog's first open, each 2-minute
  // re-appearance, and a new guard's SOS landing while the dialog is already
  // open for someone else's, all look the same: an id this ref hasn't seen
  // before. A guard already listed being acknowledged away, or another poll
  // with no new ids, doesn't replay it. Stop entirely once nobody is left.
  useEffect(() => {
    const currentIds = new Set(visibleAlerts.map((alert) => alert._id));

    if (currentIds.size === 0) {
      stopAlertSound();
    } else {
      const hasNewAlert = [...currentIds].some(
        (id) => !seenAlertIdsRef.current.has(id)
      );
      if (hasNewAlert) {
        playAlertSound();
      }
    }

    seenAlertIdsRef.current = currentIds;
  }, [visibleAlerts, playAlertSound, stopAlertSound]);

  const handleSnoozeAll = () => {
    const snoozedNow = visibleAlerts.map((alert) => alert._id);
    if (!snoozedNow.length) {
      return;
    }

    // Closing the dialog always silences it, without waiting on the effect
    // below to observe the emptied list.
    stopAlertSound();

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
                  onClick={() => {
                    // Silence as soon as this was the last guard still
                    // waiting; if others remain unacknowledged the tone must
                    // keep going for them.
                    if (visibleAlerts.length <= 1) {
                      stopAlertSound();
                    }
                    acknowledgeMutation.mutate(alert._id);
                  }}
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

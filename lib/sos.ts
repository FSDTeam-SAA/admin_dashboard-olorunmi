"use client";

import { formatDateTimeLabel } from "@/lib/utils";
import type { SosAlertItem } from "@/types/api";

/**
 * Polling cadence shared by the SOS popup, the header badge and the SOS list.
 * Matches the interval already used by the alert management page.
 */
export const SOS_REFETCH_INTERVAL = 5000;

/**
 * Coordinates plus a map link, or null when the trigger carried no GPS fix.
 */
export const getSosLocationLabel = (alert: SosAlertItem) => {
  const latitude = alert.location?.latitude;
  const longitude = alert.location?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return {
    text: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
  };
};

/**
 * When the alert was triggered, annotated with the guard's own local time.
 */
export const getSosTriggeredLabel = (alert: SosAlertItem) => {
  const absolute = alert.triggeredAt ? formatDateTimeLabel(alert.triggeredAt) : "-";

  if (alert.localTime) {
    return `${absolute} (guard local time ${alert.localTime})`;
  }

  return absolute;
};

/**
 * When the alert was acknowledged, or "-" while it is still pending.
 */
export const getSosAcknowledgedLabel = (alert: SosAlertItem) => {
  if (!alert.acknowledgedAt) {
    return "-";
  }

  return formatDateTimeLabel(alert.acknowledgedAt);
};

/**
 * Name of the admin who acknowledged the alert.
 */
export const getSosAcknowledgedByLabel = (alert: SosAlertItem) => {
  const acknowledgedBy = alert.acknowledgedBy;
  if (!acknowledgedBy) {
    return "-";
  }

  return acknowledgedBy.name || acknowledgedBy.userId || "Admin";
};

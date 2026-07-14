import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateLabel(dateValue: string | Date) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(dateValue: string | Date) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getUserInitials(name?: string | null) {
  if (!name) {
    return "NA";
  }

  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function decodeJwtExpiry(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as {
      exp?: number;
    };

    if (!decoded.exp) {
      return null;
    }

    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

export function buildPagination(currentPage: number, totalPages: number) {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let value = currentPage - 1; value <= currentPage + 1; value += 1) {
    if (value > 1 && value < totalPages) {
      pages.add(value);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
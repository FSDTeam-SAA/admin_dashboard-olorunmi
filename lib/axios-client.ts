"use client";

import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const baseUrlRaw =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000";

const apiBaseUrl = baseUrlRaw.endsWith("/")
  ? `${baseUrlRaw}api/v1`
  : `${baseUrlRaw}/api/v1`;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * `getSession()` is an uncached network call to /api/auth/session, so calling it
 * per request doubled the request count and prepended a full round trip to every
 * API call. The access token is a JWT that already carries its own expiry, so we
 * hold it in memory and only go back to next-auth once it is close to expiring.
 */
let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;
let inFlightSession: Promise<string | null> | null = null;

// Refresh slightly early so a request is never sent with a just-expired token.
const EXPIRY_THRESHOLD = 60 * 1000;

const readJwtExpiry = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };

    return decoded.exp ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

export const clearCachedAccessToken = () => {
  cachedToken = null;
  cachedTokenExpiresAt = 0;
  inFlightSession = null;
};

const resolveAccessToken = async () => {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - EXPIRY_THRESHOLD) {
    return cachedToken;
  }

  // Concurrent requests on a page load must share one session lookup rather
  // than each firing their own.
  if (!inFlightSession) {
    inFlightSession = getSession()
      .then((session) => {
        const token = session?.accessToken ?? null;
        cachedToken = token;
        // Fall back to a short window when the token carries no readable exp,
        // so we re-check soon instead of caching an unknown token forever.
        cachedTokenExpiresAt = token
          ? readJwtExpiry(token) || Date.now() + 5 * 60 * 1000
          : 0;
        return token;
      })
      .finally(() => {
        inFlightSession = null;
      });
  }

  return inFlightSession;
};

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await resolveAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      clearCachedAccessToken();
      await signOut({ callbackUrl: "/login" });
    }

    return Promise.reject(error);
  }
);

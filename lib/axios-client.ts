"use client";

import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const baseUrlRaw =
  process.env.NEXTPUBLICBASEURL ||
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

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await signOut({ callbackUrl: "/login" });
    }

    return Promise.reject(error);
  }
);

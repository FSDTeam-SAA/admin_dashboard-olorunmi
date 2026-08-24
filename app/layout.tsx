import type { Metadata } from "next";

import { AppProviders } from "@/components/providers";

import faviconImage from "./favicon.png";

import "./globals.css";

// `favicon.jpg` isn't a name/extension Next's file-based icon convention picks
// up on its own (only `favicon.ico` or `icon.*` are auto-detected — see
// node_modules/next/dist/docs/.../app-icons.md) and, separately, ANY explicit
// `icons` field here fully disables that auto-detection anyway. So the file is
// wired in explicitly instead, via a static import so it gets a fingerprinted
// build URL. `app/favicon.ico` is left in place — Next always serves it at
// `/favicon.ico` as its own route independent of this metadata, which keeps it
// as a fallback for legacy user agents that request that path directly.
export const metadata: Metadata = {
  title: "Olorunmi Admin Dashboard",
  description: "Admin dashboard for user and alert management",
  icons: {
    icon: faviconImage.src,
    shortcut: faviconImage.src,
    apple: faviconImage.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

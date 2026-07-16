import type { Metadata } from "next";

import { AppProviders } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Olorunmi Admin Dashboard",
  description: "Admin dashboard for user and alert management",
  icons: {
    icon: "/logo-rss.png",
    shortcut: "/logo-rss.png",
    apple: "/logo-rss.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#efefef] font-sans text-[#1f1f1f] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

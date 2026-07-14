import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { AppProviders } from "@/components/providers";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full bg-[#efefef] font-sans text-[#1f1f1f] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}



import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: "Focus / Copy — UPSC Study Desk",
  description: "A calm, structured workspace for UPSC preparation notes.",
  openGraph: {
    images: [
      {
        url: "/static/og_default.png", // Use relative path
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/static/og_default.png", // Use relative path
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

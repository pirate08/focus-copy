import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
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
        url: "/static/og_default.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/static/og_default.png",
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
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#fff",
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
            },
            success: {
              style: {
                background: "#065f46",
                border: "1px solid #047857",
              },
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
              duration: 4000,
            },
            error: {
              style: {
                background: "#7f1d1d",
                border: "1px solid #dc2626",
              },
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              duration: 4000,
            },
            loading: {
              style: {
                background: "#1e293b",
                border: "1px solid #475569",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

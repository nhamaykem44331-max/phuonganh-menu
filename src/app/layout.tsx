// src/app/layout.tsx
// Root layout — Providers + fonts

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: {
    default: "Nhà hàng Phương Anh",
    template: "%s | Nhà hàng Phương Anh",
  },
  description:
    "Thực đơn trực tuyến - Đặt bàn, đặt tiệc tại Nhà hàng Phương Anh, Thái Nguyên",
  keywords: ["nhà hàng", "phương anh", "thực đơn", "đặt bàn", "thái nguyên"],
  openGraph: {
    siteName: "Nhà hàng Phương Anh",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

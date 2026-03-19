// src/app/layout.tsx
// Root layout — Providers + next/font (M4+M5)

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/SessionProvider";
import {
  Cormorant_Garamond,
  Lora,
  Inter,
} from "next/font/google";

// M4: Dùng next/font thay vì <link> — self-hosted, zero layout shift
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

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
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${cormorant.variable} ${lora.variable} ${inter.variable}`}
    >
      {/* M4: Bỏ <head> link Google Fonts — next/font tự xử lý */}
      <body className={lora.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

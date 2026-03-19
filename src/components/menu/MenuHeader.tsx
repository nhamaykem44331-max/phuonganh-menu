// src/components/menu/MenuHeader.tsx
"use client";

import { Phone, FileText, ChefHat } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function MenuHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-navy border-b border-gold/20 py-1.5 px-4 hidden sm:block">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] text-gold/80 uppercase tracking-widest font-medium">
          <p>Mở cửa: 10:00 - 22:30 hàng ngày</p>
          <div className="flex gap-4">
            <p>Tân Lập 04, Phường Tích Lương, TP. Thái Nguyên</p>
            <p className="hidden md:block">|</p>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-ivory/90 backdrop-blur-md shadow-sm border-b border-border py-2"
            : "bg-navy py-4"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className={`w-10 h-10 flex items-center justify-center border border-gold/30 rounded-sm transition-colors ${
                scrolled ? "bg-navy" : "bg-transparent"
              }`}
            >
              <ChefHat
                size={22}
                className={scrolled ? "text-gold" : "text-gold"}
                strokeWidth={1.5}
              />
            </div>
            <div className="flex flex-col">
              <p
                className={`font-display font-semibold text-lg leading-none tracking-[0.2em] uppercase transition-colors ${
                  scrolled ? "text-navy" : "text-ivory"
                }`}
              >
                PHƯƠNG ANH
              </p>
              <p
                className={`text-[10px] font-body uppercase tracking-[0.15em] mt-1 transition-colors ${
                  scrolled ? "text-charcoal/60" : "text-gold/80"
                }`}
              >
                Nhà hàng & Khách sạn
              </p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a
              href="tel:0986482222"
              className={`hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 border transition-all ${
                scrolled
                  ? "border-navy/20 text-navy hover:bg-navy hover:text-gold"
                  : "border-gold/40 text-gold hover:bg-gold hover:text-navy"
              }`}
            >
              <Phone size={14} strokeWidth={1.5} />
              098.648.2222
            </a>
            <Link
              href="/bao-gia?guests=10"
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-5 py-2.5 transition-all ${
                scrolled
                  ? "bg-navy text-gold border border-navy hover:bg-navy/90"
                  : "bg-gold text-navy border border-gold hover:bg-ivory hover:border-ivory"
              }`}
            >
              <FileText size={16} strokeWidth={1.5} />
              Xem báo giá
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

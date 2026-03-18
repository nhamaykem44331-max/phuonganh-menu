// src/components/menu/CartFloatButton.tsx
"use client";

import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export function CartFloatButton() {
  const { getTotalItems, getTotalPrice, toggleCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || totalItems === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-navy border-t border-gold/30 shadow-[0_-5px_20px_rgba(10,15,30,0.2)]"
      style={{ animation: "slideUpBar 0.5s cubic-bezier(0.2,0.8,0.2,1) both" }}
    >
      <style>{`
        @keyframes slideUpBar {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Info */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-ivory/5 text-gold">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-navy text-[10px] font-bold rounded-full flex items-center justify-center font-body">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          </div>
          <div className="ml-2">
            <p className="text-[9px] text-ivory/60 uppercase tracking-widest font-medium mb-1 border-b border-ivory/20 pb-0.5 inline-block">
              Tổng tạm tính
            </p>
            <div className="bg-gradient-to-r from-gold/20 to-transparent border border-gold/50 rounded pl-2 pr-4 py-1.5 shadow-[0_0_15px_rgba(201,168,76,0.15)] flex items-center">
              <span className="text-gold text-[10px] mr-1.5">₫</span>
              <p className="font-display text-[22px] text-gold font-bold leading-none tracking-wider drop-shadow-sm">
                {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(totalPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={toggleCart}
          className="px-6 py-2.5 bg-gold text-navy font-semibold uppercase tracking-widest text-xs hover:bg-ivory transition-colors font-ui"
        >
          Xem thực đơn
        </button>
      </div>
    </div>
  );
}

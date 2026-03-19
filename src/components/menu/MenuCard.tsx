// src/components/menu/MenuCard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Minus, Flame, Sparkles, Star } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

interface MenuItem {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  tags: string[];
}

const TAG_CONFIG = {
  hot: { label: "Signature", Icon: Flame },
  new: { label: "New Arrival", Icon: Sparkles },
  best_seller: { label: "Best Seller", Icon: Star },
} as const;

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

const getFoodImageUrl = (name: string, description?: string | null): string => {
  const text = (name + ' ' + (description || '')).toLowerCase();
  if (text.includes('gà') || text.includes('chicken')) return '/foods/ga-nuong.jpg';
  if (text.includes('lẩu thái')) return '/foods/lau-thai.jpg';
  if (text.includes('lẩu bò')) return '/foods/lau-bo.jpg';
  if (text.includes('gỏi cuốn') || text.includes('spring roll')) return '/foods/goi-cuon.jpg';
  if (text.includes('cá lóc')) return '/foods/ca-loc-nuong.jpg';
  if (text.includes('tôm sú') || text.includes('tôm nướng')) return '/foods/tom-nuong.jpg';
  if (text.includes('chả giò') || text.includes('spring roll')) return '/foods/cha-gio.jpg';
  if (text.includes('nước ép') || text.includes('cam')) return '/foods/nuoc-ep-cam.jpg';
  if (text.includes('tráng miệng') || text.includes('flan') || text.includes('dessert')) return '/foods/trang-mieng.jpg';
  if (text.includes('tôm') || text.includes('hải sản') || text.includes('cá') || text.includes('mực') || text.includes('nghêu')) return '/foods/hai-san.jpg';
  if (text.includes('lẩu')) return '/foods/lau-thai.jpg';
  return '/foods/hai-san.jpg';
};

interface MenuCardProps {
  item: MenuItem;
  index: number;
}

export function MenuCard({ item, index }: MenuCardProps) {
  const [added, setAdded] = useState(false);
  const { addItem, items, updateQuantity, removeItem } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItem = items.find((i) => i.menuItemId === item.id);
  const quantity = mounted ? (cartItem?.quantity ?? 0) : 0;

  const handleAdd = useCallback(() => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      nameEn: item.nameEn,
      price: item.price,
      imageUrl: item.imageUrl,
    });

    // Flash animation feedback
    setAdded(true);
    setTimeout(() => setAdded(false), 600);
  }, [addItem, item]);

  const handleDecrease = useCallback(() => {
    if (quantity === 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, quantity - 1);
    }
  }, [quantity, removeItem, updateQuantity, item.id]);

  // Staggered entrance animation via CSS
  const animDelay = `${Math.min(index * 40, 400)}ms`;

  // Get top tag to display
  const topTag = (["hot", "new", "best_seller"] as const).find((t) =>
    item.tags.includes(t)
  );

  const displayImage = item.imageUrl || getFoodImageUrl(item.name, item.description);

  return (
    <article
      className="card-lift bg-white rounded-md overflow-hidden border border-border/80"
      style={{
        animationDelay: animDelay,
        animation: `fadeSlideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both`,
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Image */}
      <div className="menu-img-wrap bg-ivory h-48 sm:h-56 relative isolate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Tag badge - Elegant Italic Style */}
        {topTag && (() => {
          const { label } = TAG_CONFIG[topTag];
          return (
            <span
              className="absolute top-3 left-3 luxury-badge bg-navy/80 px-3 py-1 rounded backdrop-blur-sm"
            >
              • {label}
            </span>
          );
        })()}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="font-display font-bold text-charcoal text-[17px] leading-tight line-clamp-2 mb-1">
          {item.name}
        </h3>
        {item.nameEn && (
          <p className="text-xs text-muted-gold tracking-widest uppercase mb-2">{item.nameEn}</p>
        )}
        {item.description && (
          <p className="text-sm text-charcoal/60 line-clamp-2 mb-4 leading-relaxed font-light hidden sm:block">
            {item.description}
          </p>
        )}

        {/* Price + Actions */}
        <div className="flex items-end justify-between mt-3 font-ui">
          {/* Price */}
          <div className="flex flex-col">
            <span className="price-tag text-[16px] font-semibold">
              {formatPrice(item.price)}
            </span>
            {item.originalPrice && (
              <span className="text-[12px] text-charcoal/40 line-through">
                {formatPrice(item.originalPrice)}
              </span>
            )}
          </div>

          {/* Quantity controls */}
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className={`w-9 h-9 rounded flex items-center justify-center transition-all border
                ${added
                  ? "bg-navy border-navy text-gold scale-95"
                  : "bg-transparent border-gold text-gold hover:bg-gold hover:text-navy active:scale-95"
                }`}
              aria-label={`Thêm ${item.name} vào giỏ`}
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrease}
                className="w-8 h-8 rounded border border-charcoal/20 text-charcoal flex items-center justify-center hover:bg-charcoal/5 transition-colors"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="w-6 text-center text-base font-medium text-navy tabular-nums">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="w-8 h-8 rounded bg-navy text-gold flex items-center justify-center hover:bg-navy/90 transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

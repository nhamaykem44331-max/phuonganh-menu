// src/components/menu/MenuGrid.tsx
"use client";

import { MenuCard } from "./MenuCard";
import { UtensilsCrossed } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  tags: string[];
  isAvailable: boolean;
}

export function MenuGrid({ items }: { items: MenuItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <UtensilsCrossed size={48} className="mb-4 opacity-30" />
        <p className="font-display text-xl text-ink/40">Không tìm thấy món nào</p>
        <p className="text-sm mt-1">Hãy thử từ khóa khác hoặc chọn danh mục khác</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, index) => (
        <MenuCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

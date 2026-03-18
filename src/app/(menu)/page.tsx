// src/app/(menu)/page.tsx
// Web 1 — Trang thực đơn chính (SSR + Client interactivity)

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { MenuHeader } from "@/components/menu/MenuHeader";
import { MenuClient } from "@/components/menu/MenuClient";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { CartFloatButton } from "@/components/menu/CartFloatButton";

// Fetch dữ liệu trên server — SSR cho SEO tốt
async function getMenuData() {
  const [categories, menuItems, banners] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: {
        category: { select: { id: true, slug: true, name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    categories,
    // Convert Decimal → number để pass xuống client component
    menuItems: menuItems.map((item) => ({
      ...item,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
    })),
    banners,
  };
}

export default async function MenuPage() {
  const { categories, menuItems, banners } = await getMenuData();

  return (
    <div className="min-h-screen bg-ivory pb-20"> {/* pb-20 to account for bottom bar */}
      <MenuHeader />

      <Suspense fallback={<MenuSkeleton />}>
        <MenuClient
          categories={categories}
          menuItems={menuItems}
          banners={banners}
        />
      </Suspense>

      {/* Floating cart button — fixed position bottom bar */}
      <CartFloatButton />

      {/* Cart drawer — slides from right */}
      <CartDrawer />
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-10 border-b border-gold/20 w-full mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-md overflow-hidden border border-charcoal/10">
            <div className="h-56 bg-charcoal/5" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-charcoal/10 rounded w-3/4" />
              <div className="h-3 bg-charcoal/5 rounded w-1/2" />
              <div className="h-6 bg-charcoal/10 rounded w-1/3 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

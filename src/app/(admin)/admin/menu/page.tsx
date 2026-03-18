// src/app/(admin)/admin/menu/page.tsx
// Admin — Quản lý thực đơn

import { prisma } from "@/lib/prisma";
import { MenuManagerClient } from "@/components/admin/MenuManagerClient";

export const metadata = { title: "Quản lý thực đơn" };

export default async function AdminMenuPage() {
  const [menuItems, categories] = await Promise.all([
    prisma.menuItem.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const items = menuItems.map((i) => ({
    ...i,
    price: Number(i.price),
    originalPrice: i.originalPrice ? Number(i.originalPrice) : null,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Thực đơn</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} món · {categories.length} danh mục
          </p>
        </div>
      </div>
      <MenuManagerClient initialItems={items} categories={categories} />
    </div>
  );
}

// src/app/(menu)/tiec/page.tsx
// Web 1 — Trang đặt tiệc & sự kiện (public)

import { prisma } from "@/lib/prisma";
import { BanquetPageClient } from "@/components/banquet/BanquetPageClient";
import { MenuHeader } from "@/components/menu/MenuHeader";

export const metadata = {
  title: "Đặt tiệc & Sự kiện | Nhà hàng Phương Anh",
  description:
    "Đặt tiệc cưới, sinh nhật, hội nghị tại Nhà hàng Phương Anh Thái Nguyên. Sảnh sang trọng, menu đa dạng, phục vụ chuyên nghiệp.",
};

async function getData() {
  const [rooms, menuItems] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      orderBy: { capacity: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return {
    rooms: rooms.map((r) => ({
      ...r,
      pricePerDay: r.pricePerDay ? Number(r.pricePerDay) : null,
    })),
    menuItems: menuItems.map((m) => ({
      ...m,
      price: Number(m.price),
      originalPrice: m.originalPrice ? Number(m.originalPrice) : null,
    })),
  };
}

export default async function BanquetPage() {
  const { rooms, menuItems } = await getData();

  return (
    <div className="min-h-screen bg-cream">
      <MenuHeader />
      <BanquetPageClient rooms={rooms} menuItems={menuItems} />
    </div>
  );
}

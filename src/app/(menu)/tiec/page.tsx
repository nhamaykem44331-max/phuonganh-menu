// src/app/(menu)/tiec/page.tsx
// Web 1 â€” Trang Ä‘áº·t tiá»‡c & sá»± kiá»‡n (public)

import { prisma } from "@/lib/prisma";
import { BanquetPageClient } from "@/components/banquet/BanquetPageClient";
import { MenuHeader } from "@/components/menu/MenuHeader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Äáº·t tiá»‡c & Sá»± kiá»‡n | NhÃ  hÃ ng PhÆ°Æ¡ng Anh",
  description:
    "Äáº·t tiá»‡c cÆ°á»›i, sinh nháº­t, há»™i nghá»‹ táº¡i NhÃ  hÃ ng PhÆ°Æ¡ng Anh ThÃ¡i NguyÃªn. Sáº£nh sang trá»ng, menu Ä‘a dáº¡ng, phá»¥c vá»¥ chuyÃªn nghiá»‡p.",
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



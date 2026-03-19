// src/app/(admin)/admin/banquets/page.tsx
// Admin — Quản lý Tiệc & Sự kiện

import { prisma } from "@/lib/prisma";
import { BanquetsAdminClient } from "@/components/banquet/BanquetsAdminClient";

export const metadata = { title: "Tiệc & Sự kiện" };

export default async function AdminBanquetsPage() {
  // To avoid complex Prop Drills and support rich client interactions (Timeline, Search, Filters),
  // we will pass the initial essential lookup data (rooms, users) and let the Client Component fetch its own tabulated data.
  const [rooms, users] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--ink)]">Quản Lý Tiệc & Sự Kiện</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Sơ đồ phòng, danh sách đặt tiệc và báo cáo doanh thu sự kiện.
        </p>
      </div>

      <BanquetsAdminClient initialRooms={rooms} initialUsers={users} />
    </div>
  );
}

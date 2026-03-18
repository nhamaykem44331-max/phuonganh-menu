// src/app/(admin)/admin/banquets/page.tsx
// Admin — Quản lý Tiệc & Sự kiện

import { prisma } from "@/lib/prisma";
import { BanquetsAdminClient } from "@/components/banquet/BanquetsAdminClient";

export const metadata = { title: "Tiệc & Sự kiện" };

export default async function AdminBanquetsPage({
  searchParams,
}: {
  searchParams: { status?: string; view?: string; month?: string };
}) {
  const now = new Date();
  const monthParam = searchParams.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = monthParam.split("-").map(Number);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const [banquets, upcoming, stats] = await Promise.all([
    // All banquets this month
    prisma.banquet.findMany({
      where: {
        eventDate: { gte: startOfMonth, lte: endOfMonth },
        ...(searchParams.status ? { status: searchParams.status as never } : {}),
      },
      include: {
        customer: { select: { name: true, phone: true } },
        room: { select: { name: true } },
      },
      orderBy: { eventDate: "asc" },
    }),

    // Next 7 days upcoming
    prisma.banquet.findMany({
      where: {
        eventDate: {
          gte: now,
          lte: new Date(Date.now() + 7 * 86400000),
        },
        status: { in: ["CONFIRMED", "DEPOSITED"] },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        room: { select: { name: true } },
      },
      orderBy: { eventDate: "asc" },
      take: 5,
    }),

    // Monthly stats
    prisma.banquet.groupBy({
      by: ["status"],
      where: { eventDate: { gte: startOfMonth, lte: endOfMonth } },
      _count: true,
      _sum: { totalPrice: true },
    }),
  ]);

  const serialized = banquets.map((b) => ({
    ...b,
    eventDate: b.eventDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    followUpDate: b.followUpDate?.toISOString() ?? null,
    pricePerPerson: b.pricePerPerson ? Number(b.pricePerPerson) : null,
    totalPrice: b.totalPrice ? Number(b.totalPrice) : null,
    depositAmount: b.depositAmount ? Number(b.depositAmount) : null,
  }));

  const upcomingSerialized = upcoming.map((b) => ({
    ...b,
    eventDate: b.eventDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    followUpDate: b.followUpDate?.toISOString() ?? null,
    pricePerPerson: b.pricePerPerson ? Number(b.pricePerPerson) : null,
    totalPrice: b.totalPrice ? Number(b.totalPrice) : null,
    depositAmount: b.depositAmount ? Number(b.depositAmount) : null,
  }));

  const monthStats = {
    total: stats.reduce((s, g) => s + g._count, 0),
    revenue: stats.reduce((s, g) => s + Number(g._sum.totalPrice ?? 0), 0),
    byStatus: Object.fromEntries(stats.map((g) => [g.status, g._count])),
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Tiệc & Sự kiện</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quản lý đặt tiệc, báo giá, theo dõi lịch sự kiện
        </p>
      </div>

      <BanquetsAdminClient
        banquets={serialized}
        upcoming={upcomingSerialized}
        monthStats={monthStats}
        currentMonth={monthParam}
        currentStatus={searchParams.status ?? ""}
        view={(searchParams.view as "list" | "calendar") ?? "list"}
      />
    </div>
  );
}

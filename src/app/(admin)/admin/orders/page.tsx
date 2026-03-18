// src/app/(admin)/admin/orders/page.tsx
// Admin — Quản lý đơn hàng

import { prisma } from "@/lib/prisma";
import { OrdersClient } from "@/components/admin/OrdersClient";

export const metadata = { title: "Đơn hàng" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? 1);
  const limit = 20;

  const where = {
    ...(searchParams.status ? { status: searchParams.status as never } : {}),
    ...(searchParams.type ? { type: searchParams.type as never } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: { menuItem: { select: { name: true } } },
          take: 5,
        },
        staff: { select: { name: true } },
        table: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const data = orders.map((o) => ({
    ...o,
    total: Number(o.total),
    subtotal: Number(o.subtotal),
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total} đơn tổng cộng
        </p>
      </div>
      <OrdersClient
        orders={data}
        total={total}
        page={page}
        limit={limit}
        currentStatus={searchParams.status ?? ""}
        currentType={searchParams.type ?? ""}
      />
    </div>
  );
}

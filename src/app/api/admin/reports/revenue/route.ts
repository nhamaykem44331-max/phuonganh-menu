// src/app/api/admin/reports/revenue/route.ts
// Admin API - Revenue reports

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function toVnHour(date: Date): number {
  const vnDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  return vnDate.getHours();
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "today"; // today | week | month
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      endDate = new Date(toParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    const [orders, totalRevenue, orderCount, topItems, hourlyRows] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { not: "CANCELLED" },
        },
        include: {
          orderItems: {
            include: { menuItem: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ["COMPLETED", "PAID"] },
        },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),

      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),

      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: "CANCELLED" },
          },
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),

      period === "today"
        ? prisma.order.findMany({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              status: { not: "CANCELLED" },
            },
            select: {
              createdAt: true,
              total: true,
            },
            orderBy: { createdAt: "asc" },
          })
        : Promise.resolve([]),
    ]);

    const menuItemIds = topItems.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, imageUrl: true },
    });
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    const topItemsWithNames = topItems.map((item) => ({
      menuItem: menuItemMap.get(item.menuItemId),
      quantity: item._sum.quantity ?? 0,
      revenue: Number(item._sum.subtotal ?? 0),
    }));

    const statusMap: Record<string, number> = {};
    orderCount.forEach((s) => {
      statusMap[s.status] = s._count;
    });

    const hourlyStats =
      period === "today"
        ? Array.from(
            hourlyRows.reduce<Map<number, { count: number; revenue: number }>>(
              (acc, row) => {
                const hour = toVnHour(row.createdAt);
                const current = acc.get(hour) ?? { count: 0, revenue: 0 };
                current.count += 1;
                current.revenue += Number(row.total);
                acc.set(hour, current);
                return acc;
              },
              new Map()
            )
          )
            .map(([hour, value]) => ({
              hour,
              count: value.count,
              revenue: value.revenue,
            }))
            .sort((a, b) => a.hour - b.hour)
        : [];

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate, to: endDate, label: period },
        summary: {
          totalRevenue: Number(totalRevenue._sum.total ?? 0),
          totalOrders: totalRevenue._count,
          avgOrderValue: Number(totalRevenue._avg.total ?? 0),
          ordersByStatus: statusMap,
        },
        topItems: topItemsWithNames,
        hourlyStats,
        recentOrders: orders.map((o) => ({
          ...o,
          total: Number(o.total),
          subtotal: Number(o.subtotal),
        })),
      },
    });
  } catch (error) {
    console.error("[API /admin/reports/revenue] Error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

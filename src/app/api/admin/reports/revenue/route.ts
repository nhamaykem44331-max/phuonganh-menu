// src/app/api/admin/reports/revenue/route.ts
// Admin API - Báo cáo doanh thu

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "today"; // today | week | month
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Tính khoảng thời gian
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
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

    // Query song song để tối ưu tốc độ
    const [
      orders,
      totalRevenue,
      orderCount,
      topItems,
      hourlyStats,
    ] = await Promise.all([
      // Đơn hàng gần đây
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

      // Tổng doanh thu
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ["COMPLETED", "PAID"] },
        },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),

      // Đếm theo trạng thái
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),

      // Top món bán chạy
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

      // Thống kê theo giờ trong ngày (chỉ cho today)
      period === "today"
        ? prisma.$queryRaw<Array<{ hour: number; count: number; revenue: number }>>`
            SELECT 
              EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int as hour,
              COUNT(*)::int as count,
              COALESCE(SUM(total), 0)::float as revenue
            FROM orders
            WHERE created_at >= ${startDate}
              AND created_at <= ${endDate}
              AND status != 'CANCELLED'
            GROUP BY hour
            ORDER BY hour
          `
        : Promise.resolve([]),
    ]);

    // Lấy tên món cho top items
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

    // Thống kê trạng thái đơn
    const statusMap: Record<string, number> = {};
    orderCount.forEach((s) => {
      statusMap[s.status] = s._count;
    });

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

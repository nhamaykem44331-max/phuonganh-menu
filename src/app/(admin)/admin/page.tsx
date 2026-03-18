// src/app/(admin)/admin/page.tsx
// Admin Dashboard — SSR stats + recent orders

import { prisma } from "@/lib/prisma";
import {
  ShoppingBag, TrendingUp, Users, UtensilsCrossed,
  ArrowUpRight, ArrowDownRight, Clock,
} from "lucide-react";
import { DashboardChart } from "@/components/admin/DashboardChart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(price);
}

function formatStatus(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    NEW:        { label: "Mới", color: "bg-blue-100 text-blue-700" },
    CONFIRMED:  { label: "Xác nhận", color: "bg-indigo-100 text-indigo-700" },
    PREPARING:  { label: "Đang nấu", color: "bg-amber-100 text-amber-700" },
    SERVING:    { label: "Phục vụ", color: "bg-green-100 text-green-700" },
    PAID:       { label: "Đã TT", color: "bg-teal-100 text-teal-700" },
    COMPLETED:  { label: "Xong", color: "bg-gray-100 text-gray-600" },
    CANCELLED:  { label: "Hủy", color: "bg-red-100 text-red-600" },
  };
  return map[status] ?? { label: status, color: "bg-gray-100 text-gray-500" };
}

async function getDashboardData() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [todayOrders, yesterdayRevenue, recentOrders, topItems, customerCount] =
    await Promise.all([
      // Today's summary
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
        _count: true,
      }),

      // Yesterday revenue (for comparison)
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfYesterday, lt: startOfToday },
          status: { in: ["COMPLETED", "PAID"] },
        },
        _sum: { total: true },
      }),

      // Recent 10 orders
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          type: true,
          status: true,
          total: true,
          createdAt: true,
          guestCount: true,
        },
      }),

      // Top 5 menu items this week
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          order: {
            createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
            status: { not: "CANCELLED" },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Total customers
      prisma.customer.count(),
    ]);

  // Fetch top item names
  const topItemNames = await prisma.menuItem.findMany({
    where: { id: { in: topItems.map((i) => i.menuItemId) } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(topItemNames.map((m) => [m.id, m.name]));

  const todayRevenue = Number(todayOrders._sum.total ?? 0);
  const yestRevenue = Number(yesterdayRevenue._sum.total ?? 0);
  const revGrowth = yestRevenue > 0
    ? ((todayRevenue - yestRevenue) / yestRevenue) * 100
    : 0;

  return {
    stats: {
      todayRevenue,
      todayOrders: todayOrders._count,
      revGrowth,
      customerCount,
    },
    recentOrders: recentOrders.map((o) => ({
      ...o,
      total: Number(o.total),
    })),
    topItems: topItems.map((i) => ({
      name: nameMap.get(i.menuItemId) ?? "Unknown",
      quantity: i._sum.quantity ?? 0,
    })),
  };
}

export default async function AdminDashboardPage() {
  const { stats, recentOrders, topItems } = await getDashboardData();

  const statCards = [
    {
      label: "Doanh thu hôm nay",
      value: formatPrice(stats.todayRevenue),
      icon: TrendingUp,
      color: "bg-jade text-white",
      change: stats.revGrowth,
    },
    {
      label: "Đơn hôm nay",
      value: stats.todayOrders.toString(),
      icon: ShoppingBag,
      color: "bg-terra text-white",
      change: null,
    },
    {
      label: "Tổng khách hàng",
      value: stats.customerCount.toLocaleString(),
      icon: Users,
      color: "bg-gold text-white",
      change: null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p className="font-display text-2xl font-bold text-ink mt-1">{value}</p>
                {change !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs mt-1 font-medium ${
                      change >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {change >= 0 ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}
                    {Math.abs(change).toFixed(1)}% so với hôm qua
                  </div>
                )}
              </div>
              <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Top Items */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart placeholder — DashboardChart is a client component */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-ink mb-4">Doanh thu 7 ngày qua</h2>
          <DashboardChart />
        </div>

        {/* Top items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-ink mb-4">
            <UtensilsCrossed size={16} className="inline mr-1.5 text-jade" />
            Món bán chạy tuần này
          </h2>
          <ul className="space-y-3">
            {topItems.map((item, i) => (
              <li key={item.name} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-jade-light text-jade text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-ink flex-1 truncate">{item.name}</span>
                <span className="text-xs font-bold text-terra">{item.quantity} món</span>
              </li>
            ))}
            {topItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            )}
          </ul>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-ink">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mã đơn
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Khách hàng
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Thời gian
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tổng tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => {
                const { label, color } = formatStatus(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-jade">
                        {order.orderCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-ink truncate max-w-[140px]">
                        {order.customerName ?? "—"}
                      </p>
                      {order.guestCount && (
                        <p className="text-xs text-muted-foreground">
                          {order.guestCount} khách
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} />
                        {new Date(order.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit", minute: "2-digit",
                          day: "2-digit", month: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold text-ink price-tag">
                        {formatPrice(order.total)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              Chưa có đơn hàng nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

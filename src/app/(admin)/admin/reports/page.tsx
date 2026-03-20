// src/app/(admin)/admin/reports/page.tsx
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Báo cáo" };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPeriodRange(period: string) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function toVnDayKey(date: Date): string {
  const vnDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  const yyyy = vnDate.getFullYear();
  const mm = String(vnDate.getMonth() + 1).padStart(2, "0");
  const dd = String(vnDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDayKey(dayKey: string): string {
  const [yyyy, mm, dd] = dayKey.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const period = searchParams.period ?? "month";

  const fallback = getPeriodRange(period);
  const from = searchParams.from ? new Date(searchParams.from) : fallback.start;
  const to = searchParams.to ? new Date(searchParams.to) : fallback.end;

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const [paidAgg, allOrders, statusGroup, topItemsRaw, dailyRows, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ["PAID", "COMPLETED"] },
      },
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: from, lte: to } },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          createdAt: { gte: from, lte: to },
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
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
      },
    }),
  ]);

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: topItemsRaw.map((i) => i.menuItemId) } },
    select: { id: true, name: true },
  });
  const menuNameMap = new Map(menuItems.map((m) => [m.id, m.name]));

  const statusMap = statusGroup.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {});

  const dayMap = new Map<string, { orders: number; revenue: number }>();
  for (const row of dailyRows) {
    const key = toVnDayKey(row.createdAt);
    const current = dayMap.get(key) ?? { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += Number(row.total);
    dayMap.set(key, current);
  }

  const dailyRaw = Array.from(dayMap.entries())
    .map(([day, value]) => ({ day, orders: value.orders, revenue: value.revenue }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totalRevenue = Number(paidAgg._sum.total ?? 0);
  const avgOrderValue = Number(paidAgg._avg.total ?? 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[var(--admin-border)] rounded-xl p-4 shadow-sm">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" method="GET">
          <select
            name="period"
            defaultValue={period}
            className="px-3 py-2.5 text-sm border border-[var(--admin-border)] rounded-lg"
          >
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày gần đây</option>
            <option value="month">Tháng này</option>
            <option value="custom">Tùy chỉnh</option>
          </select>
          <input name="from" type="date" defaultValue={searchParams.from} className="px-3 py-2.5 text-sm border border-[var(--admin-border)] rounded-lg" />
          <input name="to" type="date" defaultValue={searchParams.to} className="px-3 py-2.5 text-sm border border-[var(--admin-border)] rounded-lg" />
          <button className="px-4 py-2.5 bg-[var(--admin-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Cập nhật báo cáo
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Doanh thu (Paid/Completed)</p>
          <p className="mt-2 text-3xl font-display font-bold text-emerald-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tổng đơn không hủy</p>
          <p className="mt-2 text-3xl font-display font-bold text-indigo-700">{allOrders}</p>
        </div>
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Giá trị đơn trung bình</p>
          <p className="mt-2 text-3xl font-display font-bold text-amber-700">{formatCurrency(avgOrderValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Xu hướng doanh thu theo ngày</h2>
          <div className="space-y-2">
            {dailyRaw.length === 0 && <p className="text-sm text-slate-500">Không có dữ liệu trong khoảng thời gian này.</p>}
            {dailyRaw.map((row) => {
              const revenue = Number(row.revenue || 0);
              const widthPercent = totalRevenue > 0 ? Math.max((revenue / totalRevenue) * 100, 4) : 4;
              const dayText = formatDayKey(row.day);
              return (
                <div key={row.day} className="grid grid-cols-[110px_1fr_110px] gap-3 items-center">
                  <span className="text-xs text-slate-500">{dayText}</span>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${widthPercent}%` }} />
                  </div>
                  <span className="text-xs text-right font-semibold text-slate-700">{formatCurrency(revenue)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Trạng thái đơn</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">{status}</span>
                <strong className="text-slate-800">{count}</strong>
              </div>
            ))}
            {Object.keys(statusMap).length === 0 && <p className="text-slate-500">Không có dữ liệu.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Top món bán chạy</h2>
          <div className="space-y-3">
            {topItemsRaw.map((item) => (
              <div key={item.menuItemId} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-700">{menuNameMap.get(item.menuItemId) ?? "Món đã xóa"}</span>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{item._sum.quantity ?? 0} món</p>
                  <p className="text-xs text-emerald-700">{formatCurrency(Number(item._sum.subtotal ?? 0))}</p>
                </div>
              </div>
            ))}
            {topItemsRaw.length === 0 && <p className="text-slate-500 text-sm">Không có dữ liệu.</p>}
          </div>
        </div>

        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Đơn gần nhất</h2>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <p className="font-semibold text-slate-800">{order.orderCode}</p>
                  <p className="text-xs text-slate-500">
                    {order.customerName || "Khách lẻ"} • {order.type} • {order.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{formatCurrency(Number(order.total))}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-slate-500 text-sm">Không có dữ liệu.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

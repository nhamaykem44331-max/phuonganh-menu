// src/app/(admin)/admin/customers/page.tsx
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Khách hàng" };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(Number(searchParams.page ?? 1), 1);
  const limit = 20;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [customers, total, totalCustomers, returningCustomers, vipCustomers] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            banquets: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: [{ totalSpent: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
    prisma.customer.count(),
    prisma.customer.count({ where: { visitCount: { gt: 1 } } }),
    prisma.customer.count({ where: { totalSpent: { gte: 5000000 } } }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tổng khách hàng</p>
          <p className="mt-2 text-3xl font-display font-bold text-slate-800">{totalCustomers}</p>
        </div>
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Khách quay lại</p>
          <p className="mt-2 text-3xl font-display font-bold text-indigo-600">{returningCustomers}</p>
        </div>
        <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Khách VIP (&gt;= 5 triệu)</p>
          <p className="mt-2 text-3xl font-display font-bold text-amber-600">{vipCustomers}</p>
        </div>
      </div>

      <div className="bg-white border border-[var(--admin-border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--admin-border)] flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <form method="GET" className="flex gap-2 w-full md:max-w-lg">
            <input
              name="q"
              defaultValue={q}
              placeholder="Tìm theo tên, số điện thoại hoặc email..."
              className="flex-1 px-3 py-2.5 text-sm border border-[var(--admin-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/20"
            />
            <button className="px-4 py-2.5 bg-[var(--admin-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Tìm
            </button>
          </form>
          <p className="text-sm text-slate-500">
            Hiển thị <strong>{customers.length}</strong> / {total} khách hàng
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="text-left px-4 py-3">Khách hàng</th>
                <th className="text-left px-4 py-3">Liên hệ</th>
                <th className="text-right px-4 py-3">Lượt ghé</th>
                <th className="text-right px-4 py-3">Đơn hàng</th>
                <th className="text-right px-4 py-3">Tiệc</th>
                <th className="text-right px-4 py-3">Tổng chi tiêu</th>
                <th className="text-right px-4 py-3">Điểm</th>
                <th className="text-left px-4 py-3">Lần gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[var(--admin-border)] hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{customer.name}</p>
                    {customer.notes ? <p className="text-xs text-slate-500 mt-1 line-clamp-1">{customer.notes}</p> : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-700 font-medium">{customer.phone}</p>
                    <p className="text-xs text-slate-500">{customer.email || "-"}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-700">{customer.visitCount}</td>
                  <td className="px-4 py-3.5 text-right">{customer._count.orders}</td>
                  <td className="px-4 py-3.5 text-right">{customer._count.banquets}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">{formatCurrency(Number(customer.totalSpent))}</td>
                  <td className="px-4 py-3.5 text-right">{customer.loyaltyPoints}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">
                    {customer.orders[0]?.createdAt
                      ? new Date(customer.orders[0].createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Không có khách hàng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[var(--admin-border)] flex items-center justify-between text-sm text-slate-500">
          <span>
            Trang {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <a
              href={`/admin/customers?page=${Math.max(page - 1, 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1.5 rounded-md border ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
            >
              Trước
            </a>
            <a
              href={`/admin/customers?page=${Math.min(page + 1, totalPages)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1.5 rounded-md border ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
            >
              Sau
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/(admin)/admin/pos/page.tsx
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PosClient } from "@/components/admin/PosClient";

export const metadata = { title: "POS" };

export default async function AdminPosPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const [categories, menuItems, tables] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        price: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.table.findMany({
      where: { isActive: true },
      select: { id: true, name: true, area: true, capacity: true, status: true },
      orderBy: [{ area: "asc" }, { name: "asc" }],
    }),
  ]);

  const normalizedItems = menuItems.map((item) => ({
    ...item,
    price: Number(item.price),
  }));

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
        <h1 className="font-display text-2xl text-slate-900">Điểm bán hàng (POS)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tạo đơn tại bàn hoặc mang về cho nhân viên phục vụ. Dữ liệu đồng bộ trực tiếp vào hệ thống đơn hàng.
        </p>
      </div>

      <PosClient categories={categories} menuItems={normalizedItems} tables={tables} />
    </div>
  );
}

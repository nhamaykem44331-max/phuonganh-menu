// src/app/(admin)/admin/menu/categories/page.tsx
import { prisma } from "@/lib/prisma";
import { CategoryManagerClient } from "@/components/admin/CategoryManagerClient";

export const metadata = { title: "Quản lý danh mục" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { menuItems: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6">
      <div className="hidden">
        {/* Top hidden header because AdminHeader handles it natively */}
      </div>
      <CategoryManagerClient initialItems={categories} />
    </div>
  );
}

// src/app/api/categories/route.ts
// Public API — Danh sách danh mục

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 600; // Cache 10 phút

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, name: true, nameEn: true,
        slug: true, icon: true, sortOrder: true,
        _count: { select: { menuItems: { where: { isAvailable: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories.map((c) => ({
        ...c,
        itemCount: c._count.menuItems,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

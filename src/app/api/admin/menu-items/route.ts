// src/app/api/admin/menu-items/route.ts
// Admin API - CRUD Món ăn (yêu cầu quyền Admin/Manager)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

// =============================================
// VALIDATION
// =============================================

const MenuItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number().positive("Giá phải lớn hơn 0"),
  originalPrice: z.number().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

// =============================================
// GET - Danh sách món (Admin view - kể cả ẩn)
// =============================================

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where: {
          ...(category ? { category: { slug: category } } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { nameEn: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.menuItem.count({
        where: {
          ...(category ? { category: { slug: category } } : {}),
        },
      }),
    ]);

    const data = items.map((item) => ({
      ...item,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// =============================================
// POST - Thêm món mới
// =============================================

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = MenuItemSchema.parse(body);

    // Tự tạo slug từ tên
    const baseSlug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    // Đảm bảo slug unique
    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const existing = await prisma.menuItem.findUnique({ where: { slug } });
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const menuItem = await prisma.menuItem.create({
      data: { ...data, slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...menuItem,
          price: Number(menuItem.price),
          originalPrice: menuItem.originalPrice
            ? Number(menuItem.originalPrice)
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

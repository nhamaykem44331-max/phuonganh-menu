// src/app/api/admin/menu-items/[id]/route.ts
// Admin API - Cập nhật / Xóa món ăn

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const UpdateMenuItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(2).optional(),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

// =============================================
// GET - Chi tiết một món
// =============================================

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const item = await prisma.menuItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        priceHistory: {
          orderBy: { changedAt: "desc" },
          take: 10,
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy món" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// =============================================
// PUT - Cập nhật món
// =============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = UpdateMenuItemSchema.parse(body);

    // Nếu có thay đổi giá → lưu lịch sử
    if (data.price !== undefined) {
      const currentItem = await prisma.menuItem.findUnique({
        where: { id: params.id },
        select: { price: true },
      });

      if (currentItem && Number(currentItem.price) !== data.price) {
        await prisma.priceHistory.create({
          data: {
            menuItemId: params.id,
            oldPrice: currentItem.price,
            newPrice: data.price,
            changedBy: session.user.id,
          },
        });
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id: params.id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    revalidatePath("/");
    revalidatePath("/(menu)");
    revalidateTag("menu-data");

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        price: Number(updated.price),
        originalPrice: updated.originalPrice
          ? Number(updated.originalPrice)
          : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// =============================================
// DELETE - Xóa món (soft delete: ẩn, không xóa DB)
// =============================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // Soft delete: chỉ ẩn đi, không xóa khỏi DB
    await prisma.menuItem.update({
      where: { id: params.id },
      data: { isAvailable: false },
    });

    revalidatePath("/");
    revalidatePath("/(menu)");
    revalidateTag("menu-data");

    return NextResponse.json({
      success: true,
      message: "Món đã được ẩn khỏi thực đơn",
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

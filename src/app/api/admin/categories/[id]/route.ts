// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const UpdateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  nameEn: z.string().optional().nullable(),
  slug: z.string().optional(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;
    const body = await request.json();
    const data = UpdateCategorySchema.parse(body);

    if (data.slug) {
      const existing = await prisma.category.findFirst({
        where: { slug: data.slug, id: { not: params.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
      }
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data,
    });

    revalidatePath("/");
    revalidatePath("/(menu)");
    revalidateTag("menu-data");

    return NextResponse.json({ success: true, data: updated, revalidated: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;
    await prisma.category.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    revalidatePath("/");
    revalidatePath("/(menu)");
    revalidateTag("menu-data");

    return NextResponse.json({ success: true, message: "Đã ẩn danh mục", revalidated: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

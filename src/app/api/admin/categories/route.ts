// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const CategorySchema = z.object({
  name: z.string().min(2),
  nameEn: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = CategorySchema.parse(body);

    let slug = data.slug;
    if (!slug) {
      const baseSlug = data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      
      slug = baseSlug;
      let counter = 0;
      while (true) {
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (!existing) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    } else {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
      }
    }

    const newCategory = await prisma.category.create({
      data: { ...data, slug },
    });

    revalidatePath("/");
    revalidatePath("/(menu)");
    revalidateTag("menu-data", "max");

    return NextResponse.json({ success: true, data: newCategory, revalidated: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// src/app/api/menu/route.ts
// Public API - Lấy thực đơn (có cache 5 phút)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache thực đơn 5 phút để giảm tải DB
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const available = searchParams.get("available");

    const menuItems = await prisma.menuItem.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(available !== "false" ? { isAvailable: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { nameEn: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            icon: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    // Convert Decimal to number cho JSON serialization
    const items = menuItems.map((item) => ({
      ...item,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
    }));

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error) {
    console.error("[API /menu] Error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải thực đơn" },
      { status: 500 }
    );
  }
}

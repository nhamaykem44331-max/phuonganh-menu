// src/app/api/rooms/route.ts
// Public API — Danh sách phòng / sảnh tiệc

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        capacity: true,
        pricePerDay: true,
        equipment: true,
        images: true,
        description: true,
      },
      orderBy: { capacity: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: rooms.map((r) => ({
        ...r,
        pricePerDay: r.pricePerDay ? Number(r.pricePerDay) : null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

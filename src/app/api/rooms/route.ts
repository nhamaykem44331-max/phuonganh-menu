// src/app/api/rooms/route.ts
// Public API â€” Danh sÃ¡ch phÃ²ng / sáº£nh tiá»‡c

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
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
    return NextResponse.json({ error: "Lá»—i server" }, { status: 500 });
  }
}


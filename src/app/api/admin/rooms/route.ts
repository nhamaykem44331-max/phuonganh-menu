// src/app/api/admin/rooms/route.ts
// Admin API — Quản lý phòng / sảnh tiệc

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const RoomSchema = z.object({
  name: z.string().min(2),
  capacity: z.number().min(1).max(2000),
  pricePerDay: z.number().positive().optional().nullable(),
  equipment: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const rooms = await prisma.room.findMany({ orderBy: { capacity: "asc" } });
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = RoomSchema.parse(body);
    const room = await prisma.room.create({ data });
    return NextResponse.json(
      { success: true, data: { ...room, pricePerDay: room.pricePerDay ? Number(room.pricePerDay) : null } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

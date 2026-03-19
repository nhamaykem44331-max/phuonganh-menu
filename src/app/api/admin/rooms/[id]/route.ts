import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const UpdateRoomSchema = z.object({
  name: z.string().min(2).optional(),
  capacity: z.number().min(1).max(2000).optional(),
  pricePerDay: z.number().positive().optional().nullable(),
  equipment: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  description: z.string().optional().nullable(),
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
    const data = UpdateRoomSchema.parse(body);

    const room = await prisma.room.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ success: true, data: { ...room, pricePerDay: room.pricePerDay ? Number(room.pricePerDay) : null } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;
    await prisma.room.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Không thể xóa phòng (có thể đang có tiệc dính liền)" }, { status: 500 });
  }
}

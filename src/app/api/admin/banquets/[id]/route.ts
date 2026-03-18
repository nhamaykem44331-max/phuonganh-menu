// src/app/api/admin/banquets/[id]/route.ts
// Admin API — Chi tiết, cập nhật, báo giá tiệc

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z
    .enum(["INQUIRY", "QUOTED", "CONFIRMED", "DEPOSITED", "COMPLETED", "CANCELLED"])
    .optional(),
  roomId: z.string().optional().nullable(),
  pricePerPerson: z.number().positive().optional().nullable(),
  depositAmount: z.number().positive().optional().nullable(),
  menuSet: z.any().optional(),
  note: z.string().max(500).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
  totalPrice: z.number().positive().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const banquet = await prisma.banquet.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        room: true,
      },
    });

    if (!banquet) {
      return NextResponse.json({ error: "Không tìm thấy tiệc" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...banquet,
        pricePerPerson: banquet.pricePerPerson ? Number(banquet.pricePerPerson) : null,
        totalPrice: banquet.totalPrice ? Number(banquet.totalPrice) : null,
        depositAmount: banquet.depositAmount ? Number(banquet.depositAmount) : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = UpdateSchema.parse(body);

    // Tính lại total nếu đổi giá/số khách
    let totalPrice = data.totalPrice;
    if (data.pricePerPerson) {
      const current = await prisma.banquet.findUnique({
        where: { id: params.id },
        select: { guestCount: true },
      });
      if (current) {
        totalPrice = data.pricePerPerson * current.guestCount;
      }
    }

    const updated = await prisma.banquet.update({
      where: { id: params.id },
      data: {
        ...data,
        totalPrice: totalPrice ?? undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        menuSet: data.menuSet ? JSON.stringify(data.menuSet) : undefined,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        room: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        pricePerPerson: updated.pricePerPerson ? Number(updated.pricePerPerson) : null,
        totalPrice: updated.totalPrice ? Number(updated.totalPrice) : null,
        depositAmount: updated.depositAmount ? Number(updated.depositAmount) : null,
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await prisma.banquet.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

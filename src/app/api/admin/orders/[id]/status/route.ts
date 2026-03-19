// src/app/api/admin/orders/[id]/status/route.ts
// Admin API — Cập nhật trạng thái đơn hàng

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notifyOrderStatusChange } from "@/lib/webhooks";
import { z } from "zod";

const Schema = z.object({
  status: z.enum(["NEW","CONFIRMED","PREPARING","SERVING","PAID","COMPLETED","CANCELLED"]),
  reason: z.string().optional(), // Lý do hủy nếu CANCELLED
});

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;

    const body = await request.json();
    const { status, reason } = Schema.parse(body);

    const current = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, orderCode: true, status: true, tableId: true,
                table: { select: { name: true } } },
    });

    if (!current) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: status as never,
        ...(reason ? { note: reason } : {}),
      },
    });

    // Notify n8n
    await notifyOrderStatusChange({
      id: updated.id,
      orderCode: updated.orderCode,
      oldStatus: current.status,
      newStatus: status,
      tableId: current.tableId,
      tableName: current.table?.name,
    });

    return NextResponse.json({ success: true, data: { id: updated.id, status } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

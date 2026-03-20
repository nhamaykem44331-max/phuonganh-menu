// src/app/api/admin/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const UpdateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  loyaltyPoints: z.coerce.number().min(0).optional(),
  visitCount: z.coerce.number().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;

    const body = await request.json();
    const data = UpdateCustomerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: { ...customer, totalSpent: Number(customer.totalSpent) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

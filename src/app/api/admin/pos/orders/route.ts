// src/app/api/admin/pos/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { notifyNewOrder } from "@/lib/webhooks";
import { z } from "zod";

const PosOrderSchema = z.object({
  type: z.enum(["DINE_IN", "TAKEAWAY"]),
  tableId: z.string().optional().nullable(),
  customerName: z.string().min(2).max(100).optional().nullable(),
  customerPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,10}$/)
    .optional()
    .nullable()
    .or(z.literal("")),
  guestCount: z.coerce.number().min(1).max(200).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.coerce.number().min(1).max(100),
        note: z.string().max(200).optional().nullable(),
      })
    )
    .min(1),
});

async function generateOrderCode(): Promise<string> {
  const now = new Date();
  const dateStr = now
    .toLocaleDateString("vi-VN", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
    .replace(/\//g, "");

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  });

  return `PA-${dateStr}-${String(count + 1).padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = PosOrderSchema.parse(body);

    if (data.type === "DINE_IN" && !data.tableId) {
      return NextResponse.json({ success: false, error: "Đơn tại bàn cần chọn bàn." }, { status: 400 });
    }

    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
      select: { id: true, name: true, price: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ success: false, error: "Một số món không còn khả dụng." }, { status: 400 });
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const itemsCreate = data.items.map((item) => {
      const menuItem = menuMap.get(item.menuItemId)!;
      const unitPrice = Number(menuItem.price);
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        subtotal: lineSubtotal,
        note: item.note || null,
      };
    });

    if (data.type === "DINE_IN" && data.tableId) {
      const table = await prisma.table.findUnique({
        where: { id: data.tableId },
        select: { id: true },
      });
      if (!table) {
        return NextResponse.json({ success: false, error: "Bàn không tồn tại." }, { status: 400 });
      }
    }

    const customerPhone = data.customerPhone || null;
    const customerName = data.customerName || null;
    const orderCode = await generateOrderCode();

    const order = await prisma.$transaction(async (tx) => {
      let customerId: string | null = null;
      if (customerPhone) {
        const customer = await tx.customer.upsert({
          where: { phone: customerPhone },
          update: {
            name: customerName || undefined,
            visitCount: { increment: 1 },
            ...(subtotal > 0 ? { totalSpent: { increment: subtotal } } : {}),
          },
          create: {
            name: customerName || "Khách POS",
            phone: customerPhone,
            visitCount: 1,
            totalSpent: subtotal,
          },
        });
        customerId = customer.id;
      }

      const created = await tx.order.create({
        data: {
          orderCode,
          customerId,
          staffId: session.user.id,
          tableId: data.type === "DINE_IN" ? data.tableId || null : null,
          customerName: customerName,
          customerPhone: customerPhone,
          guestCount: data.guestCount || null,
          type: data.type,
          status: "NEW",
          subtotal,
          total: subtotal,
          note: data.note || null,
          metadata: {
            source: "POS",
            createdByRole: session.user.role,
          },
          orderItems: {
            create: itemsCreate,
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: { select: { name: true } },
            },
          },
        },
      });

      if (data.type === "DINE_IN" && data.tableId) {
        await tx.table.update({
          where: { id: data.tableId },
          data: { status: "OCCUPIED" },
        });
      }

      return created;
    });

    await notifyNewOrder({
      id: order.id,
      orderCode: order.orderCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      type: order.type,
      status: order.status,
      total: subtotal,
      guestCount: order.guestCount,
      deliveryTime: order.deliveryTime,
      note: order.note,
      items: order.orderItems.map((oi) => ({
        name: oi.menuItem.name,
        quantity: oi.quantity,
        unitPrice: Number(oi.unitPrice),
        note: oi.note,
      })),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          orderCode: order.orderCode,
          total: subtotal,
          status: order.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    console.error("[API /admin/pos/orders] Error:", error);
    return NextResponse.json({ success: false, error: "Không thể tạo đơn POS" }, { status: 500 });
  }
}

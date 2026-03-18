// src/app/api/orders/route.ts
// Public API - Tạo đơn hàng mới (đặt bàn online)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewOrder } from "@/lib/webhooks";
import { z } from "zod";

// =============================================
// VALIDATION SCHEMA
// =============================================

const CreateOrderSchema = z.object({
  customerName: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  customerPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,10}$/, "Số điện thoại không hợp lệ"),
  guestCount: z.number().min(1).max(500),
  deliveryTime: z.string().datetime().optional(),
  type: z.enum(["ONLINE", "BANQUET"]).default("ONLINE"),
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().min(1).max(100),
        note: z.string().max(200).optional(),
      })
    )
    .min(1, "Vui lòng chọn ít nhất 1 món"),
});

// =============================================
// GENERATE ORDER CODE
// =============================================

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

  // Đếm số đơn trong ngày hôm nay
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.order.count({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  const seq = String(count + 1).padStart(3, "0");
  return `PA-${dateStr}-${seq}`;
}

// =============================================
// POST HANDLER
// =============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateOrderSchema.parse(body);

    // Lấy thông tin và giá của các món
    const menuItemIds = validated.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isAvailable: true,
      },
    });

    // Kiểm tra tất cả món đều tồn tại và còn phục vụ
    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { success: false, error: "Một số món không còn phục vụ" },
        { status: 400 }
      );
    }

    // Tính tiền
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    const orderItemsData = validated.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const unitPrice = Number(menuItem.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        note: item.note,
      };
    });

    const orderCode = await generateOrderCode();

    // Tìm hoặc tạo customer theo phone
    const customer = await prisma.customer.upsert({
      where: { phone: validated.customerPhone },
      update: {
        name: validated.customerName,
        visitCount: { increment: 1 },
      },
      create: {
        name: validated.customerName,
        phone: validated.customerPhone,
        visitCount: 1,
      },
    });

    // Tạo đơn hàng
    const order = await prisma.order.create({
      data: {
        orderCode,
        customerId: customer.id,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        guestCount: validated.guestCount,
        deliveryTime: validated.deliveryTime
          ? new Date(validated.deliveryTime)
          : undefined,
        type: validated.type as "ONLINE" | "BANQUET",
        status: "NEW",
        subtotal,
        total: subtotal,
        note: validated.note,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Cập nhật total_spent của customer
    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalSpent: { increment: subtotal } },
    });

    // Bắn webhook ra n8n (fire and forget)
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
        message: "Đặt bàn thành công! Chúng tôi sẽ liên hệ xác nhận sớm.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("[API /orders POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tạo đơn hàng, vui lòng thử lại" },
      { status: 500 }
    );
  }
}

// =============================================
// GET - Tra cứu đơn hàng
// =============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const phone = searchParams.get("phone");

  if (!code || !phone) {
    return NextResponse.json(
      { success: false, error: "Cần cung cấp mã đơn hàng và số điện thoại" },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        orderCode: code,
        customerPhone: phone,
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: { name: true, imageUrl: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[API /orders GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server" },
      { status: 500 }
    );
  }
}

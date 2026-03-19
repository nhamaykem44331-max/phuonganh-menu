// src/app/api/banquets/route.ts
// Public API — Gửi yêu cầu đặt tiệc / sự kiện

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewBanquet } from "@/lib/webhooks";
import { z } from "zod";

const BanquetSchema = z.object({
  customerName: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  customerPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,10}$/, "Số điện thoại không hợp lệ"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  eventType: z.string().min(2, "Vui lòng chọn loại sự kiện"),
  eventDate: z.string().datetime({ message: "Ngày không hợp lệ" }),
  guestCount: z.coerce.number().min(10, "Tối thiểu 10 khách").max(1000),
  roomId: z.string().optional().nullable(),
  pricePerPerson: z.coerce.number().optional().nullable(),
  menuSet: z
    .array(
      z.object({
        menuItemId: z.string(),
        name: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number(),
      })
    )
    .optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = BanquetSchema.parse(body);

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: { phone: data.customerPhone },
      update: { name: data.customerName, email: data.customerEmail || undefined },
      create: {
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail || undefined,
      },
    });

    // Tính tổng
    const totalPrice =
      data.pricePerPerson && data.guestCount
        ? data.pricePerPerson * data.guestCount
        : null;

    const banquet = await prisma.banquet.create({
      data: {
        customerId: customer.id,
        roomId: data.roomId || null,
        eventType: data.eventType,
        eventDate: new Date(data.eventDate),
        guestCount: data.guestCount,
        pricePerPerson: data.pricePerPerson ?? null,
        menuSet: JSON.stringify({
          items: data.menuSet || [],
          metadata: {
            bookingId: "BK" + Date.now().toString().slice(-11),
            companyName: "",
            tableCount: Math.ceil((data.guestCount || 10) / 10),
            eventTime: "17:30",
            preOrderMenu: "",
            additionalServices: [],
            staffAssigned: null,
            reminderSent: false,
          }
        }),
        totalPrice,
        status: "INQUIRY",
        note: data.note,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Follow-up sau 1 ngày
      },
      include: {
        room: { select: { name: true } },
      },
    });

    // Notify n8n → Telegram quản lý + Google Sheets
    await notifyNewBanquet({
      id: banquet.id,
      eventType: banquet.eventType,
      eventDate: banquet.eventDate,
      guestCount: banquet.guestCount,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      roomName: banquet.room?.name ?? null,
      pricePerPerson: data.pricePerPerson ?? null,
      totalPrice,
      note: data.note,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: banquet.id },
        message:
          "Yêu cầu đặt tiệc đã được gửi! Chúng tôi sẽ liên hệ trong 2 giờ.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[API /banquets POST]", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server, vui lòng thử lại" },
      { status: 500 }
    );
  }
}

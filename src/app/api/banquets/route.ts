// src/app/api/banquets/route.ts
// Public API â€” Gá»­i yÃªu cáº§u Ä‘áº·t tiá»‡c / sá»± kiá»‡n

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewBanquet } from "@/lib/webhooks";
import { z } from "zod";

const BanquetSchema = z.object({
  customerName: z.string().min(2, "TÃªn tá»‘i thiá»ƒu 2 kÃ½ tá»±"),
  customerPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,10}$/, "Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  eventType: z.string().min(2, "Vui lÃ²ng chá»n loáº¡i sá»± kiá»‡n"),
  eventDate: z.string().datetime({ message: "NgÃ y khÃ´ng há»£p lá»‡" }),
  eventTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giá» khÃ´ng há»£p lá»‡"),
  guestCount: z.coerce.number().min(10, "Tá»‘i thiá»ƒu 10 khÃ¡ch").max(1000),
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

    // TÃ­nh tá»•ng
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
            eventTime: data.eventTime,
            preOrderMenu: "",
            additionalServices: [],
            staffAssigned: null,
            reminderSent: false,
          }
        }),
        totalPrice,
        status: "INQUIRY",
        note: data.note,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Follow-up sau 1 ngÃ y
      },
      include: {
        room: { select: { name: true } },
      },
    });

    // Notify n8n â†’ Telegram quáº£n lÃ½ + Google Sheets
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
          "YÃªu cáº§u Ä‘áº·t tiá»‡c Ä‘Ã£ Ä‘Æ°á»£c gá»­i! ChÃºng tÃ´i sáº½ liÃªn há»‡ trong 2 giá».",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dá»¯ liá»‡u khÃ´ng há»£p lá»‡", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[API /banquets POST]", error);
    return NextResponse.json(
      { success: false, error: "Lá»—i server, vui lÃ²ng thá»­ láº¡i" },
      { status: 500 }
    );
  }
}


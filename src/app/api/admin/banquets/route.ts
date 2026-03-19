// src/app/api/admin/banquets/route.ts
// Admin API — Quản lý tiệc & sự kiện

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const roomId = searchParams.get("roomId");
    const month = searchParams.get("month"); // YYYY-MM
    const q = searchParams.get("q"); // name or phone
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    let dateFilter = {};
    if (month) {
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = {
        eventDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      };
    } else {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (from || to) {
        dateFilter = {
          eventDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        };
      }
    }

    const where = {
      ...dateFilter,
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(roomId && roomId !== "ALL" ? { roomId } : {}),
      ...(q
        ? {
            customer: {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { phone: { contains: q } },
              ],
            },
          }
        : {}),
    };

    const [banquets, total] = await Promise.all([
      prisma.banquet.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true, email: true } },
          room: { select: { name: true, capacity: true } },
        },
        orderBy: { eventDate: "asc" },
        skip: limit === -1 ? undefined : (page - 1) * limit,
        take: limit === -1 ? undefined : limit,
      }),
      prisma.banquet.count({ where }),
    ]);

    // Parse metadata
    const parsedData = banquets.map((b) => {
      let menuSetObj: { items: any[]; metadata: any } = { items: [], metadata: {} };
      try {
        if (b.menuSet) {
          const parsed = JSON.parse(b.menuSet as string);
          if (Array.isArray(parsed)) {
            menuSetObj.items = parsed;
          } else if (parsed && typeof parsed === "object") {
            menuSetObj = parsed;
          }
        }
      } catch (e) {}

      return {
        ...b,
        customerName: b.customer?.name || "Khách vô danh",
        customerPhone: b.customer?.phone || "",
        customerEmail: b.customer?.email || "",
        pricePerPerson: b.pricePerPerson ? Number(b.pricePerPerson) : null,
        totalPrice: b.totalPrice ? Number(b.totalPrice) : null,
        depositAmount: b.depositAmount ? Number(b.depositAmount) : null,
        bookingId: menuSetObj.metadata?.bookingId || `BK${b.createdAt.getTime()}`,
        eventTime: menuSetObj.metadata?.eventTime || "10:00",
        tableCount: menuSetObj.metadata?.tableCount || Math.ceil(b.guestCount / 10),
        companyName: menuSetObj.metadata?.companyName || "",
        preOrderMenu: menuSetObj.metadata?.preOrderMenu || "",
        additionalServices: menuSetObj.metadata?.additionalServices || [],
        staffAssigned: menuSetObj.metadata?.staffAssigned || null,
        reminderSent: menuSetObj.metadata?.reminderSent || false,
        menuItems: menuSetObj.items || [],
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedData,
      pagination: { 
        page, 
        limit, 
        total, 
        totalPages: limit === -1 ? 1 : Math.ceil(total / limit) 
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi server" },
      { status: 500 }
    );
  }
}

const CreateBanquetAdminSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^(0|\+84)[0-9]{8,10}$/),
  customerEmail: z.string().email().optional().or(z.literal("")),
  companyName: z.string().optional(),
  roomId: z.string(),
  eventType: z.string().min(2),
  eventDate: z.string().datetime(),
  eventTime: z.string(),
  guestCount: z.coerce.number().min(1),
  tableCount: z.coerce.number().min(0),
  pricePerPerson: z.coerce.number().optional().nullable(),
  totalPrice: z.coerce.number().optional().nullable(),
  depositAmount: z.coerce.number().optional().nullable(),
  preOrderMenu: z.string().optional(),
  additionalServices: z.array(z.string()).optional(),
  staffAssigned: z.string().optional().nullable(),
  status: z.string(),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = CreateBanquetAdminSchema.parse(body);

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

    const bookingId = "BK" + Date.now().toString().slice(-11);

    const banquet = await prisma.banquet.create({
      data: {
        customerId: customer.id,
        roomId: data.roomId,
        eventType: data.eventType,
        eventDate: new Date(data.eventDate),
        guestCount: data.guestCount,
        pricePerPerson: data.pricePerPerson ?? null,
        totalPrice: data.totalPrice ?? null,
        depositAmount: data.depositAmount ?? null,
        status: data.status as any,
        note: data.note,
        menuSet: JSON.stringify({
          items: [],
          metadata: {
            bookingId,
            companyName: data.companyName,
            tableCount: data.tableCount,
            eventTime: data.eventTime,
            preOrderMenu: data.preOrderMenu,
            additionalServices: data.additionalServices || [],
            staffAssigned: data.staffAssigned,
            reminderSent: false,
          }
        })
      },
    });

    return NextResponse.json({ success: true, data: { id: banquet.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi server" }, { status: 500 });
  }
}

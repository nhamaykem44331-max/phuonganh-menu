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
  
  // Metadata fields
  companyName: z.string().optional(),
  eventTime: z.string().optional(),
  tableCount: z.coerce.number().optional(),
  preOrderMenu: z.string().optional(),
  additionalServices: z.array(z.string()).optional(),
  staffAssigned: z.string().optional().nullable(),
  reminderSent: z.boolean().optional(),
  
  // Custom core fields
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  eventDate: z.string().datetime().optional(),
  guestCount: z.coerce.number().optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;

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

    let menuSetObj: { items: any[]; metadata: any } = { items: [], metadata: {} };
    try {
      if (banquet.menuSet) {
        const parsed = JSON.parse(banquet.menuSet as string);
        if (Array.isArray(parsed)) {
          menuSetObj.items = parsed;
        } else if (parsed && typeof parsed === "object") {
          menuSetObj = parsed;
        }
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: {
        ...banquet,
        customerName: banquet.customer?.name || "Khách vô danh",
        customerPhone: banquet.customer?.phone || "",
        customerEmail: banquet.customer?.email || "",
        pricePerPerson: banquet.pricePerPerson ? Number(banquet.pricePerPerson) : null,
        totalPrice: banquet.totalPrice ? Number(banquet.totalPrice) : null,
        depositAmount: banquet.depositAmount ? Number(banquet.depositAmount) : null,
        bookingId: menuSetObj.metadata?.bookingId || `BK${banquet.createdAt.getTime()}`,
        eventTime: menuSetObj.metadata?.eventTime || "10:00",
        tableCount: menuSetObj.metadata?.tableCount || Math.ceil(banquet.guestCount / 10),
        companyName: menuSetObj.metadata?.companyName || "",
        preOrderMenu: menuSetObj.metadata?.preOrderMenu || "",
        additionalServices: menuSetObj.metadata?.additionalServices || [],
        staffAssigned: menuSetObj.metadata?.staffAssigned || null,
        reminderSent: menuSetObj.metadata?.reminderSent || false,
        menuItems: menuSetObj.items || [],
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;

    const body = await request.json();
    const data = UpdateSchema.parse(body);

    const current = await prisma.banquet.findUnique({
      where: { id: params.id },
      select: { guestCount: true, menuSet: true, customerId: true, eventDate: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    }

    let menuSetObj: { items: any[]; metadata: any } = { items: [], metadata: {} };
    try {
      if (current.menuSet) {
        const parsed = JSON.parse(current.menuSet as string);
        if (Array.isArray(parsed)) {
          menuSetObj.items = parsed;
        } else if (parsed && typeof parsed === "object") {
          menuSetObj = parsed;
        }
      }
    } catch (e) {}

    // Update metadata fields if provided
    if (data.companyName !== undefined) menuSetObj.metadata.companyName = data.companyName;
    if (data.eventTime !== undefined) menuSetObj.metadata.eventTime = data.eventTime;
    if (data.tableCount !== undefined) menuSetObj.metadata.tableCount = data.tableCount;
    if (data.preOrderMenu !== undefined) menuSetObj.metadata.preOrderMenu = data.preOrderMenu;
    if (data.additionalServices !== undefined) menuSetObj.metadata.additionalServices = data.additionalServices;
    if (data.staffAssigned !== undefined) menuSetObj.metadata.staffAssigned = data.staffAssigned;
    if (data.reminderSent !== undefined) menuSetObj.metadata.reminderSent = data.reminderSent;
    if (data.menuSet !== undefined) menuSetObj.items = data.menuSet;

    // Tính lại total nếu chỉ đổi giá hoặc đổi guestCount
    let totalPrice = data.totalPrice;
    if (data.pricePerPerson !== undefined && data.pricePerPerson !== null && data.totalPrice === undefined) {
       const finalGuestCount = data.guestCount !== undefined ? data.guestCount : current.guestCount;
       totalPrice = data.pricePerPerson * finalGuestCount;
    }

    // Nếu có đổi thông tin khách hàng thì cập nhật
    if (data.customerName || data.customerPhone) {
       const customerId = current.customerId;
       if (customerId) {
         await prisma.customer.update({
           where: { id: customerId },
           data: {
             ...(data.customerName ? { name: data.customerName } : {}),
             ...(data.customerPhone ? { phone: data.customerPhone } : {})
           }
         });
       }
    }

    const updated = await prisma.banquet.update({
      where: { id: params.id },
      data: {
        status: data.status,
        roomId: data.roomId,
        pricePerPerson: data.pricePerPerson,
        depositAmount: data.depositAmount,
        note: data.note,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        guestCount: data.guestCount,
        totalPrice: totalPrice,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        menuSet: JSON.stringify(menuSetObj),
      },
      include: {
        customer: { select: { name: true, phone: true } },
        room: { select: { name: true } },
      },
    });

    if (data.customerName || data.customerPhone) {
      await prisma.customer.update({
        where: { id: current.customerId! },
        data: {
          name: data.customerName,
          phone: data.customerPhone,
        }
      });
      if (data.customerName) updated.customer!.name = data.customerName;
      if (data.customerPhone) updated.customer!.phone = data.customerPhone;
    }

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await context.params;
    await prisma.banquet.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi server" }, { status: 500 });
  }
}

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
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where = {
      ...(status ? { status: status as never } : {}),
      ...(from || to
        ? {
            eventDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.banquet.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: banquets.map((b) => ({
        ...b,
        pricePerPerson: b.pricePerPerson ? Number(b.pricePerPerson) : null,
        totalPrice: b.totalPrice ? Number(b.totalPrice) : null,
        depositAmount: b.depositAmount ? Number(b.depositAmount) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

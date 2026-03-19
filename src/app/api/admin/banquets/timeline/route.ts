// src/app/api/admin/banquets/timeline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    
    if (!month) {
      return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });
    }

    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const [rooms, bookings] = await Promise.all([
      prisma.room.findMany({
        where: { isActive: true },
        select: { id: true, name: true, capacity: true },
        orderBy: { name: "asc" },
      }),
      prisma.banquet.findMany({
        where: {
          eventDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: {
          id: true,
          eventDate: true,
          status: true,
          guestCount: true,
          roomId: true,
          menuSet: true,
          createdAt: true,
          customer: {
            select: { name: true },
          },
        },
      }),
    ]);

    const formattedBookings = bookings.map((b) => {
      let metadata: any = {};
      try {
        if (b.menuSet) {
          const parsed = JSON.parse(b.menuSet as string);
          if (parsed && !Array.isArray(parsed) && parsed.metadata) {
            metadata = parsed.metadata;
          }
        }
      } catch (e) {}

      return {
        id: b.id,
        bookingId: metadata.bookingId || `BK${b.createdAt.getTime()}`,
        customerName: b.customer?.name || "Khách hàng",
        roomId: b.roomId,
        eventDate: b.eventDate.toISOString(),
        eventTime: metadata.eventTime || "10:00",
        status: b.status,
        guestCount: b.guestCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        bookings: formattedBookings,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

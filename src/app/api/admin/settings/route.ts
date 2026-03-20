// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const SettingsPayload = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
      group: z.string().default("general"),
    })
  ),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const payload = SettingsPayload.parse(body);

    await prisma.$transaction(
      payload.settings.map((item) =>
        prisma.setting.upsert({
          where: { key: item.key },
          update: { value: item.value, group: item.group },
          create: { key: item.key, value: item.value, group: item.group },
        })
      )
    );

    const settings = await prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

    return NextResponse.json({ success: true, data: settings });
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

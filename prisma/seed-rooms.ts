// prisma/seed-rooms.ts
// Seed thêm phòng/sảnh và tiệc mẫu (chạy sau seed.ts)
// Lệnh: npx tsx prisma/seed-rooms.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏛️ Seed phòng/sảnh tiệc...");

  // ─── Rooms ───────────────────────────────────────────────
  const rooms = [
    {
      name: "Sảnh Hội Nghị A",
      capacity: 150,
      pricePerDay: 5_000_000,
      equipment: ["projector", "microphone", "ac", "sound", "wifi"],
      images: [],
      description: "Sảnh hội nghị hiện đại, sức chứa 150 khách, đầy đủ thiết bị AV",
      isActive: true,
    },
    {
      name: "Phòng VIP Sen Vàng",
      capacity: 30,
      pricePerDay: 2_000_000,
      equipment: ["ac", "sound", "wifi", "lighting"],
      images: [],
      description: "Phòng riêng tư sang trọng, phù hợp tiệc gia đình và họp mặt thân mật",
      isActive: true,
    },
    {
      name: "Sảnh Tiệc Cưới Phương Anh",
      capacity: 300,
      pricePerDay: 10_000_000,
      equipment: ["projector", "microphone", "ac", "sound", "lighting", "stage", "parking"],
      images: [],
      description:
        "Sảnh tiệc cưới đẳng cấp, sân khấu chuyên nghiệp, ánh sáng lung linh, bãi đỗ xe rộng",
      isActive: true,
    },
    {
      name: "Sân Vườn Ngoài Trời",
      capacity: 80,
      pricePerDay: 3_000_000,
      equipment: ["sound", "lighting", "wifi"],
      images: [],
      description:
        "Không gian xanh mát ngoài trời, lý tưởng cho tiệc BBQ, liên hoan công ty, sự kiện ngoài trời",
      isActive: true,
    },
  ];

  for (const room of rooms) {
    await prisma.room.create({ data: room });
  }
  console.log(`✅ Tạo ${rooms.length} phòng/sảnh`);

  // ─── Sample banquets ──────────────────────────────────────
  const sampleCustomer = await prisma.customer.upsert({
    where: { phone: "0912345678" },
    update: {},
    create: { name: "Nguyễn Thị Lan", phone: "0912345678", email: "lan@example.com" },
  });

  const mainRoom = await prisma.room.findFirst({
    where: { name: { contains: "Hội Nghị" } },
  });

  const banquets = [
    {
      customerId: sampleCustomer.id,
      roomId: mainRoom?.id,
      eventType: "Tiệc cưới",
      eventDate: new Date(Date.now() + 7 * 86400000), // 7 ngày nữa
      guestCount: 120,
      pricePerPerson: 800_000,
      totalPrice: 96_000_000,
      depositAmount: 20_000_000,
      status: "DEPOSITED" as const,
      note: "Hoa trang trí màu hồng, bánh cưới 5 tầng",
      followUpDate: new Date(Date.now() + 2 * 86400000),
    },
    {
      customerId: sampleCustomer.id,
      eventType: "Hội nghị / Hội thảo",
      eventDate: new Date(Date.now() + 14 * 86400000),
      guestCount: 80,
      pricePerPerson: 500_000,
      totalPrice: 40_000_000,
      status: "CONFIRMED" as const,
      note: "Cần máy chiếu và hệ thống âm thanh",
    },
    {
      customerId: sampleCustomer.id,
      eventType: "Tiệc sinh nhật",
      eventDate: new Date(Date.now() + 3 * 86400000),
      guestCount: 25,
      pricePerPerson: 600_000,
      totalPrice: 15_000_000,
      status: "INQUIRY" as const,
    },
  ];

  for (const b of banquets) {
    await prisma.banquet.create({ data: b });
  }
  console.log(`✅ Tạo ${banquets.length} tiệc mẫu`);

  console.log("\n🎉 Seed phòng & tiệc hoàn thành!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// prisma/seed.ts
// Seed data ban đầu cho Nhà hàng Phương Anh

import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed database...");

  // =============================================
  // 1. TẠO ADMIN MẶC ĐỊNH
  // =============================================
  const adminPassword = await hash("PhuongAnh@2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@phuonganh.vn" },
    update: {},
    create: {
      email: "admin@phuonganh.vn",
      password: adminPassword,
      name: "Quản trị viên",
      role: UserRole.ADMIN,
      pin: "1234",
      isActive: true,
    },
  });
  console.log("✅ Admin:", admin.email);

  // Staff mẫu
  const staffPassword = await hash("staff123", 12);
  await prisma.user.upsert({
    where: { email: "nhanvien1@phuonganh.vn" },
    update: {},
    create: {
      email: "nhanvien1@phuonganh.vn",
      password: staffPassword,
      name: "Nguyễn Thị Hoa",
      role: UserRole.STAFF,
      pin: "5678",
      isActive: true,
    },
  });
  console.log("✅ Staff mẫu đã tạo");

  // =============================================
  // 2. TẠO DANH MỤC
  // =============================================
  const categories = [
    { name: "Khai vị", nameEn: "Appetizer", slug: "khai-vi", icon: "🥗", sortOrder: 1 },
    { name: "Món gà", nameEn: "Chicken", slug: "mon-ga", icon: "🍗", sortOrder: 2 },
    { name: "Hải sản", nameEn: "Seafood", slug: "hai-san", icon: "🦐", sortOrder: 3 },
    { name: "Lẩu", nameEn: "Hot Pot", slug: "lau", icon: "🍲", sortOrder: 4 },
    { name: "Nướng", nameEn: "BBQ", slug: "nuong", icon: "🥩", sortOrder: 5 },
    { name: "Cơm & Phở", nameEn: "Rice & Noodle", slug: "com-pho", icon: "🍜", sortOrder: 6 },
    { name: "Đồ uống", nameEn: "Drinks", slug: "do-uong", icon: "🥤", sortOrder: 7 },
    { name: "Tráng miệng", nameEn: "Dessert", slug: "trang-mieng", icon: "🍮", sortOrder: 8 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log("✅ Danh mục đã tạo:", Object.keys(createdCategories).length);

  // =============================================
  // 3. TẠO MÓN ĂN MẪU
  // =============================================
  const menuItems = [
    // Khai vị
    {
      categorySlug: "khai-vi",
      name: "Gỏi cuốn tôm thịt",
      nameEn: "Fresh Spring Rolls",
      description: "Gỏi cuốn tươi với tôm, thịt heo, rau sống, bún tươi",
      price: 45000,
      tags: ["best_seller"],
      sortOrder: 1,
    },
    {
      categorySlug: "khai-vi",
      name: "Chả giò giòn",
      nameEn: "Crispy Spring Rolls",
      description: "Chả giò chiên giòn nhân thịt cua, nấm, cà rốt",
      price: 55000,
      tags: ["hot"],
      sortOrder: 2,
    },
    // Gà
    {
      categorySlug: "mon-ga",
      name: "Gà nướng mật ong",
      nameEn: "Honey Grilled Chicken",
      description: "Gà ta nướng mật ong thảo mộc, da giòn, thịt mềm",
      price: 180000,
      tags: ["best_seller", "hot"],
      sortOrder: 1,
    },
    {
      categorySlug: "mon-ga",
      name: "Gà hấp gừng hành",
      nameEn: "Steamed Chicken with Ginger",
      description: "Gà ta hấp gừng, hành lá, chấm nước mắm gừng",
      price: 160000,
      tags: [],
      sortOrder: 2,
    },
    // Hải sản
    {
      categorySlug: "hai-san",
      name: "Tôm sú nướng muối ớt",
      nameEn: "Grilled Tiger Shrimp",
      description: "Tôm sú tươi nướng muối ớt, ăn kèm nước chấm chua ngọt",
      price: 280000,
      originalPrice: 320000,
      tags: ["best_seller"],
      sortOrder: 1,
    },
    {
      categorySlug: "hai-san",
      name: "Cá lóc nướng trui",
      nameEn: "Grilled Snakehead Fish",
      description: "Cá lóc đồng nướng rơm, cuốn bánh tráng rau sống",
      price: 250000,
      tags: ["hot"],
      sortOrder: 2,
    },
    // Lẩu
    {
      categorySlug: "lau",
      name: "Lẩu thái hải sản",
      nameEn: "Thai Seafood Hot Pot",
      description: "Lẩu thái chua cay, mix hải sản tươi: tôm, mực, nghêu",
      price: 380000,
      tags: ["best_seller", "hot"],
      sortOrder: 1,
    },
    {
      categorySlug: "lau",
      name: "Lẩu bò nhúng dấm",
      nameEn: "Beef Vinegar Hot Pot",
      description: "Lẩu nước me chua nhẹ, thịt bò thái lát, rau thơm",
      price: 320000,
      tags: [],
      sortOrder: 2,
    },
    // Đồ uống
    {
      categorySlug: "do-uong",
      name: "Nước ép cam tươi",
      nameEn: "Fresh Orange Juice",
      description: "Cam sành ép tươi, nguyên chất không đường",
      price: 35000,
      tags: [],
      sortOrder: 1,
    },
    {
      categorySlug: "do-uong",
      name: "Trà đá",
      nameEn: "Iced Tea",
      description: "Trà Thái Nguyên pha lạnh",
      price: 10000,
      tags: [],
      sortOrder: 2,
    },
    {
      categorySlug: "do-uong",
      name: "Bia Hà Nội lon",
      nameEn: "Hanoi Beer (Can)",
      price: 25000,
      sortOrder: 3,
    },
  ];

  let itemCount = 0;
  for (const item of menuItems) {
    const { categorySlug, ...rest } = item;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    const slug = rest.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    await prisma.menuItem.upsert({
      where: { slug },
      update: {},
      create: {
        ...rest,
        categoryId,
        slug,
        isAvailable: true,
        tags: rest.tags ?? [],
      },
    });
    itemCount++;
  }
  console.log("✅ Món ăn đã tạo:", itemCount);

  // =============================================
  // 4. TẠO BÀN/PHÒNG
  // =============================================
  const tables = [
    { name: "Bàn 01", area: "Tầng 1", capacity: 4 },
    { name: "Bàn 02", area: "Tầng 1", capacity: 4 },
    { name: "Bàn 03", area: "Tầng 1", capacity: 6 },
    { name: "Bàn 04", area: "Tầng 1", capacity: 6 },
    { name: "Bàn 05", area: "Sân vườn", capacity: 8 },
    { name: "Bàn 06", area: "Sân vườn", capacity: 8 },
    { name: "Phòng VIP 1", area: "Phòng riêng", capacity: 10 },
    { name: "Phòng VIP 2", area: "Phòng riêng", capacity: 15 },
  ];

  for (const table of tables) {
    await prisma.table.create({ data: table }).catch(() => {});
  }
  console.log("✅ Bàn/phòng đã tạo:", tables.length);

  // =============================================
  // 5. CÀI ĐẶT MẶC ĐỊNH
  // =============================================
  const settings = [
    { key: "restaurant_name", value: "Nhà hàng Phương Anh", group: "general" },
    { key: "restaurant_phone", value: "0978.123.456", group: "general" },
    { key: "restaurant_address", value: "41 Đường..., Thái Nguyên", group: "general" },
    { key: "open_time", value: "10:00", group: "general" },
    { key: "close_time", value: "22:00", group: "general" },
    { key: "telegram_notify_orders", value: "true", group: "notification" },
    { key: "telegram_notify_banquets", value: "true", group: "notification" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("✅ Cài đặt mặc định đã tạo");

  console.log("\n🎉 Seed hoàn thành!");
  console.log("📧 Admin login: admin@phuonganh.vn / PhuongAnh@2026");
  console.log("🔢 Staff PIN: 5678");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

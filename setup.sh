#!/bin/bash
# setup.sh — Chạy script này để cài đặt và khởi động dự án
# Dùng trên Mac/Linux: bash setup.sh
# Dùng trên Windows: chạy từng lệnh trong setup-windows.bat

echo "=========================================="
echo "  Nhà hàng Phương Anh — Setup Script"
echo "=========================================="

# 1. Cài dependencies
echo ""
echo "📦 Bước 1: Cài đặt dependencies..."
npm install

# 2. Nhắc nhở env
echo ""
echo "⚙️  Bước 2: Cấu hình môi trường"
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "✅ Đã tạo .env.local từ .env.example"
  echo ""
  echo "⚠️  QUAN TRỌNG: Mở file .env.local và điền:"
  echo "   - DATABASE_URL    (từ Supabase)"
  echo "   - DIRECT_URL      (từ Supabase)"
  echo "   - NEXTAUTH_SECRET (chạy: openssl rand -base64 32)"
  echo ""
  echo "   Nhấn Enter sau khi đã điền .env.local..."
  read
else
  echo "✅ File .env.local đã tồn tại"
fi

# 3. Prisma migrate
echo ""
echo "🗄️  Bước 3: Tạo bảng database..."
npx prisma migrate dev --name init

# 4. Seed data
echo ""
echo "🌱 Bước 4: Tạo dữ liệu mẫu..."
npx prisma db seed
npx tsx prisma/seed-rooms.ts

# 5. Run
echo ""
echo "🚀 Bước 5: Khởi động server..."
echo ""
echo "=========================================="
echo "  ✅ Setup hoàn tất!"
echo "  🌐 Web 1 (thực đơn): http://localhost:3000"
echo "  🎉 Đặt tiệc:         http://localhost:3000/tiec"
echo "  🔧 Admin:            http://localhost:3000/admin"
echo "  📧 Login:            admin@phuonganh.vn"
echo "  🔑 Password:         PhuongAnh@2026"
echo "=========================================="
echo ""
npm run dev

# 🍽️ HƯỚNG DẪN KHỞI TẠO DỰ ÁN
## Hệ thống Thực đơn Online - Nhà hàng Phương Anh
### Next.js 14 + TypeScript + Supabase + Prisma

---

## 📁 CẤY THƯ MỤC DỰ ÁN

```
phuonganh-menu/
├── prisma/
│   ├── schema.prisma          ✅ Database schema đầy đủ
│   └── seed.ts                ✅ Dữ liệu khởi tạo
│
├── src/
│   ├── app/                   Next.js App Router
│   │   ├── (menu)/            Route group: Web 1 - Khách hàng
│   │   │   ├── page.tsx       Trang thực đơn chính
│   │   │   ├── staff/
│   │   │   │   └── page.tsx   Giao diện nhân viên order
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/           Route group: Web 2 - Admin
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx   Dashboard
│   │   │   │   ├── menu/      Quản lý thực đơn
│   │   │   │   ├── orders/    Quản lý đơn hàng
│   │   │   │   ├── banquets/  Quản lý tiệc
│   │   │   │   ├── reports/   Báo cáo
│   │   │   │   └── settings/  Cài đặt
│   │   │   ├── admin/login/
│   │   │   │   └── page.tsx   Trang đăng nhập admin
│   │   │   └── layout.tsx     Layout với sidebar admin
│   │   │
│   │   ├── api/               API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts    ✅ NextAuth handler
│   │   │   ├── menu/
│   │   │   │   └── route.ts        ✅ GET thực đơn public
│   │   │   ├── categories/
│   │   │   │   └── route.ts        GET danh mục
│   │   │   ├── orders/
│   │   │   │   └── route.ts        ✅ POST tạo đơn / GET tra cứu
│   │   │   ├── banquets/
│   │   │   │   └── route.ts        POST đặt tiệc
│   │   │   ├── staff/
│   │   │   │   ├── login/route.ts  POST đăng nhập PIN
│   │   │   │   ├── tables/route.ts GET sơ đồ bàn
│   │   │   │   └── orders/route.ts POST order tại bàn
│   │   │   ├── admin/
│   │   │   │   ├── menu-items/
│   │   │   │   │   ├── route.ts    ✅ GET + POST món ăn
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts ✅ GET + PUT + DELETE
│   │   │   │   ├── categories/
│   │   │   │   │   └── route.ts    CRUD danh mục
│   │   │   │   ├── orders/
│   │   │   │   │   └── [id]/route.ts PUT cập nhật trạng thái
│   │   │   │   └── reports/
│   │   │   │       └── revenue/
│   │   │   │           └── route.ts ✅ Báo cáo doanh thu
│   │   │   └── upload/
│   │   │       └── route.ts        POST upload ảnh Cloudinary
│   │   │
│   │   ├── layout.tsx         Root layout
│   │   └── globals.css        Global styles
│   │
│   ├── components/
│   │   ├── menu/              Web 1 components
│   │   │   ├── MenuCard.tsx   Card món ăn
│   │   │   ├── CartDrawer.tsx Popup giỏ hàng (Framer Motion)
│   │   │   ├── CategoryTabs.tsx Tabs danh mục
│   │   │   ├── SearchBar.tsx  Thanh tìm kiếm
│   │   │   ├── CartButton.tsx Nút tạm tính nổi
│   │   │   └── OrderForm.tsx  Form đặt bàn
│   │   │
│   │   ├── admin/             Web 2 components
│   │   │   ├── Sidebar.tsx    Navigation sidebar
│   │   │   ├── DashboardCards.tsx
│   │   │   ├── RevenueChart.tsx (Recharts)
│   │   │   └── OrderTable.tsx
│   │   │
│   │   └── ui/                shadcn/ui components (auto-generated)
│   │
│   ├── store/
│   │   └── useCartStore.ts    ✅ Zustand giỏ hàng
│   │
│   ├── lib/
│   │   ├── prisma.ts          ✅ Prisma client singleton
│   │   ├── auth.ts            ✅ NextAuth config
│   │   └── webhooks.ts        ✅ n8n webhook helpers
│   │
│   └── types/
│       └── next-auth.d.ts     ✅ TypeScript types extension
│
├── .env.example               ✅ Template biến môi trường
├── .env.local                 (bạn tự tạo từ .env.example)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚡ BƯỚC 1: KHỞI TẠO DỰ ÁN

### 1.1 Tạo Next.js project

```bash
# Tạo project với cấu hình chuẩn
npx create-next-app@latest phuonganh-menu \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd phuonganh-menu
```

### 1.2 Cài đặt tất cả dependencies

```bash
# === CORE ===
npm install prisma @prisma/client

# === AUTH ===
npm install next-auth bcryptjs
npm install -D @types/bcryptjs

# === STATE & ANIMATION ===
npm install zustand framer-motion

# === UI COMPONENTS ===
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# === SUPABASE REALTIME ===
npm install @supabase/supabase-js

# === CHARTS (Dashboard) ===
npm install recharts

# === FORM VALIDATION ===
npm install zod react-hook-form @hookform/resolvers

# === IMAGE & QR ===
npm install qrcode.react
npm install -D @types/qrcode.react

# === PDF EXPORT ===
npm install jspdf html2canvas

# === DATE PICKER ===
npm install react-day-picker date-fns

# === DEV TOOLS ===
npm install -D prisma tsx
```

### 1.3 Khởi tạo shadcn/ui

```bash
# Khởi tạo shadcn/ui (chọn: Default style, Zinc color, CSS variables: yes)
npx shadcn@latest init

# Cài các components thường dùng
npx shadcn@latest add button input label card badge
npx shadcn@latest add dialog sheet drawer
npx shadcn@latest add select tabs dropdown-menu
npx shadcn@latest add table form toast
npx shadcn@latest add separator skeleton avatar
```

---

## 🗄️ BƯỚC 2: THIẾT LẬP DATABASE

### 2.1 Tạo dự án Supabase

1. Vào **supabase.com** → New Project
2. Đặt tên: `phuonganh-menu`
3. Chọn Region: **Southeast Asia (Singapore)**
4. Chờ khởi tạo (~2 phút)

### 2.2 Lấy Connection String

Vào **Project Settings → Database → Connection string**:
- Copy **Transaction pooler** URL → dùng cho `DATABASE_URL`
- Copy **Session pooler** URL → dùng cho `DIRECT_URL`

### 2.3 Cấu hình Prisma

```bash
# Khởi tạo Prisma (nếu chưa có)
npx prisma init

# Copy file prisma/schema.prisma từ package đã cung cấp
# (đã có đầy đủ các bảng cho hệ thống)
```

### 2.4 Tạo bảng và seed data

```bash
# Tạo migration đầu tiên (đặt tên: init)
npx prisma migrate dev --name init

# Seed data mẫu (admin account + categories + menu mẫu)
npx prisma db seed
```

---

## 🔧 BƯỚC 3: CẤU HÌNH ENV

```bash
# Copy template
cp .env.example .env.local

# Chỉnh sửa .env.local với thông tin thật của bạn
# (Xem hướng dẫn trong file .env.example)
```

**Thêm vào `package.json`** (để prisma seed chạy được):

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Thêm vào `next.config.ts`**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
```

---

## 🚀 BƯỚC 4: CHẠY LOCALHOST

```bash
# Development server
npm run dev

# Mở trình duyệt:
# Web 1 (thực đơn khách hàng): http://localhost:3000
# Web 2 (admin): http://localhost:3000/admin
```

**Đăng nhập Admin:**
- Email: `admin@phuonganh.vn`
- Mật khẩu: `PhuongAnh@2026`

**Đăng nhập Staff (PIN):**
- PIN: `5678`

### Các lệnh hữu ích khác:

```bash
# Xem database qua giao diện đẹp
npx prisma studio
# → Mở http://localhost:5555

# Reset database và seed lại
npx prisma migrate reset

# Generate Prisma client sau khi đổi schema
npx prisma generate

# Build production
npm run build
npm start
```

---

## 🔗 BƯỚC 5: CẤU HÌNH N8N WEBHOOK

Trong n8n (đang chạy trên VPS 103.142.27.27), tạo các Webhook trigger:

| Workflow | Webhook Path | Dữ liệu nhận |
|---|---|---|
| Thông báo đơn mới | `/webhook/order-created` | orderCode, items, customer, total |
| Cập nhật đơn | `/webhook/order-updated` | orderCode, oldStatus, newStatus |
| Đặt tiệc mới | `/webhook/banquet-created` | eventType, date, guestCount, customer |

Trong `.env.local`:
```
N8N_WEBHOOK_BASE_URL=http://103.142.27.27:5678
```

---

## 📋 CHECKLIST TRIỂN KHAI

### Phase 1 - Foundation (Tuần 1-2)
- [ ] Khởi tạo Next.js project
- [ ] Cài đặt tất cả dependencies
- [ ] Setup Supabase database
- [ ] Chạy migration + seed
- [ ] Verify localhost chạy OK
- [ ] Deploy lên Vercel (free tier)

### Phase 2 - Menu & Cart (Tuần 3-4)
- [ ] Tạo trang thực đơn (CategoryTabs + MenuCard)
- [ ] Zustand cart store (đã có)
- [ ] CartDrawer với Framer Motion animation
- [ ] Responsive mobile
- [ ] Upload ảnh món ăn lên Cloudinary

### Phase 3 - Order & Booking (Tuần 5-6)
- [ ] Form đặt bàn
- [ ] POST /api/orders hoàn chỉnh
- [ ] Kết nối n8n webhook → Telegram thông báo
- [ ] Staff mode (/staff)
- [ ] Sơ đồ bàn realtime (Supabase Realtime)

### Phase 4 - Admin Panel (Tuần 7-9)
- [ ] Đăng nhập NextAuth
- [ ] Dashboard với Recharts
- [ ] CRUD Menu Items
- [ ] Quản lý đơn hàng
- [ ] Báo cáo doanh thu

### Phase 5 - Advanced (Tuần 10-12)
- [ ] QR Code cho từng bàn
- [ ] Xuất PDF bill / menu tiệc
- [ ] Kitchen Display (Supabase Realtime)
- [ ] Combo thông minh
- [ ] Quản lý tiệc & sự kiện

---

*Phiên bản: 2.0 | Tháng 3/2026 | Nhà hàng Phương Anh*

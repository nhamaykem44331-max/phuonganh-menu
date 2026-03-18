@echo off
echo ==========================================
echo   Nha hang Phuong Anh - Setup Script
echo ==========================================

echo.
echo [1/5] Cai dat dependencies...
call npm install

echo.
echo [2/5] Tao file .env.local...
if not exist ".env.local" (
  copy .env.example .env.local
  echo Da tao .env.local
  echo.
  echo QUAN TRONG: Mo file .env.local va dien:
  echo   - DATABASE_URL    (tu Supabase)
  echo   - DIRECT_URL      (tu Supabase)
  echo   - NEXTAUTH_SECRET (toi thieu 32 ky tu bat ky)
  echo.
  pause
) else (
  echo File .env.local da ton tai
)

echo.
echo [3/5] Tao bang database...
call npx prisma migrate dev --name init

echo.
echo [4/5] Tao du lieu mau...
call npx prisma db seed
call npx tsx prisma/seed-rooms.ts

echo.
echo [5/5] Khoi dong server...
echo.
echo ==========================================
echo   Setup hoan tat!
echo   Web 1:  http://localhost:3000
echo   Tiec:   http://localhost:3000/tiec
echo   Admin:  http://localhost:3000/admin
echo   Login:  admin@phuonganh.vn
echo   Pass:   PhuongAnh@2026
echo ==========================================
echo.
call npm run dev

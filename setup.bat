@echo off
echo ============================================
echo  PCG Car Booking - Setup (Windows)
echo ============================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed
  pause
  exit /b 1
)

echo [2/4] Setting up database...
call npx prisma db push
if errorlevel 1 (
  echo ERROR: Database setup failed
  pause
  exit /b 1
)

echo [3/4] Seeding sample data...
call npm run db:seed
if errorlevel 1 (
  echo WARNING: Seed failed, but continuing...
)

echo [4/4] Done!
echo.
echo ============================================
echo  Setup complete! Starting development server...
echo.
echo  Open: http://localhost:3000
echo.
echo  Login credentials:
echo    Admin:    ADMIN001 / PCG@2024
echo    GA Admin: GA001    / PCG@2024
echo    Employee: EMP001   / PCG@2024
echo ============================================
echo.

call npm run dev

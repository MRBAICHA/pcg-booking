#!/bin/bash
echo "============================================"
echo " PCG Car Booking - Setup (Linux/Mac)"
echo "============================================"
echo ""

echo "[1/4] Installing dependencies..."
npm install || { echo "ERROR: npm install failed"; exit 1; }

echo "[2/4] Setting up database..."
npx prisma db push || { echo "ERROR: Database setup failed"; exit 1; }

echo "[3/4] Seeding sample data..."
npm run db:seed || echo "WARNING: Seed failed, continuing..."

echo ""
echo "============================================"
echo " Setup complete! Run: npm run dev"
echo ""
echo " Open: http://localhost:3000"
echo ""
echo " Login:"
echo "   Admin:    ADMIN001 / PCG@2024"
echo "   GA Admin: GA001    / PCG@2024"
echo "   Employee: EMP001   / PCG@2024"
echo "============================================"

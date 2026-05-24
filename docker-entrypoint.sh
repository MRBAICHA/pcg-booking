#!/bin/sh
set -e

# สร้าง directory สำหรับ database
mkdir -p /app/prisma/data

echo "Running database migrations..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "Starting application..."
exec node server.js

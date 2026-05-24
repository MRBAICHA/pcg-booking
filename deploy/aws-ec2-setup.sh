#!/bin/bash
# ===================================================
# PCG Car Booking - AWS EC2 Setup Script
# รันบน Amazon Linux 2 / Ubuntu 22.04
# ===================================================

set -e

echo "🚀 PCG Car Booking - AWS EC2 Setup"
echo "=================================="

# --- ติดตั้ง Docker ---
echo "📦 Installing Docker..."
if command -v apt-get &> /dev/null; then
  # Ubuntu
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
elif command -v yum &> /dev/null; then
  # Amazon Linux
  sudo yum update -y
  sudo yum install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
  # Install docker-compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker installed"

# --- Setup App ---
APP_DIR="/opt/pcg-booking"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# --- สร้าง .env file ---
echo "📝 Creating .env file..."
read -p "Enter JWT_SECRET (or press Enter for auto-generated): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "Generated JWT_SECRET: $JWT_SECRET"
fi

read -p "Enter your domain or server IP (e.g. http://54.1.2.3 or https://booking.pcg.co.th): " APP_URL
APP_URL=${APP_URL:-http://localhost:3000}

cat > .env << EOF
JWT_SECRET=$JWT_SECRET
APP_URL=$APP_URL
EOF

echo "✅ .env created"

# --- Docker Compose ---
echo "📦 Creating docker-compose.yml..."
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'
services:
  app:
    image: pcg-booking:latest
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/pcg.db
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_APP_URL=${APP_URL}
    volumes:
      - sqlite_data:/app/prisma/data
    restart: unless-stopped
volumes:
  sqlite_data:
COMPOSE

echo "✅ docker-compose.yml created"

# --- Build & Start ---
echo "🏗️  Building Docker image..."
echo "(ใช้เวลาประมาณ 3-5 นาที)"

# Clone or copy app files to current directory first, then:
# docker build -t pcg-booking .
# docker-compose up -d

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Copy your project files to: $APP_DIR"
echo "  2. Run: docker build -t pcg-booking ."
echo "  3. Run: docker-compose up -d"
echo "  4. Seed database: docker-compose exec app npm run db:seed"
echo "  5. Open: $APP_URL"
echo ""
echo "🔐 Default login:"
echo "  Admin:    ADMIN001 / PCG@2024"
echo "  GA Admin: GA001    / PCG@2024"
echo "  Employee: EMP001   / PCG@2024"
echo "============================================"

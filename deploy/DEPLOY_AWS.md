# คู่มือ Deploy PCG Car Booking บน AWS

## ภาพรวม
- **EC2 t3.small** (Ubuntu 22.04) — รัน Docker
- **Nginx** — reverse proxy + HTTPS
- **SQLite** บน EBS volume — เก็บข้อมูล
- **ราคา ~$17/เดือน**

---

## ขั้นตอนที่ 1 — สร้าง EC2 บน AWS Console

1. เข้า [AWS Console](https://console.aws.amazon.com) → EC2 → **Launch Instance**
2. ตั้งค่า:
   - **Name**: `pcg-booking`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.small`
   - **Key pair**: สร้างใหม่ → ชื่อ `pcg-key` → Download `.pem`
3. **Security Group** — เปิด port:
   | Port | Protocol | Source |
   |------|----------|--------|
   | 22   | SSH      | My IP  |
   | 80   | HTTP     | Anywhere |
   | 443  | HTTPS    | Anywhere |
4. **Storage**: 20 GB gp3
5. กด **Launch Instance**

---

## ขั้นตอนที่ 2 — SSH เข้าเครื่อง EC2

```bash
# Windows: เปิด Command Prompt หรือ PowerShell
# เปลี่ยน path และ IP ตามจริง
ssh -i C:\Users\ASUS\Downloads\pcg-key.pem ubuntu@<EC2_PUBLIC_IP>
```

ถ้า error "Permission denied":
```bash
# Windows PowerShell
icacls "C:\Users\ASUS\Downloads\pcg-key.pem" /inheritance:r /grant:r "%USERNAME%:R"
```

---

## ขั้นตอนที่ 3 — ติดตั้ง Docker บน EC2

```bash
# รันบน EC2
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker

# ตรวจสอบ
docker --version
```

---

## ขั้นตอนที่ 4 — Upload โปรเจกต์ขึ้น EC2

**วิธีที่ 1: SCP (จากเครื่อง Windows)**
```powershell
# รันบนเครื่อง Windows ของคุณ
scp -i C:\Users\ASUS\Downloads\pcg-key.pem -r "f:\Working DATA 2026\PCG Company 2026\Project_PCG_Car_Booking" ubuntu@<EC2_IP>:/home/ubuntu/pcg-booking
```

**วิธีที่ 2: GitHub (แนะนำสำหรับการ update)**
```bash
# บน EC2
git clone https://github.com/<your-username>/pcg-booking.git /home/ubuntu/pcg-booking
```

---

## ขั้นตอนที่ 5 — ตั้งค่า Environment

```bash
cd /home/ubuntu/pcg-booking

# สร้าง JWT Secret แบบสุ่ม
JWT=$(openssl rand -base64 32)

# สร้าง .env
cat > .env << EOF
DATABASE_URL=file:/app/prisma/data/pcg.db
JWT_SECRET=$JWT
NEXT_PUBLIC_APP_URL=http://<EC2_PUBLIC_IP>
EOF

echo "✅ .env created"
cat .env
```

---

## ขั้นตอนที่ 6 — Build และ Run

```bash
cd /home/ubuntu/pcg-booking

# Build Docker image (ใช้เวลา 3-5 นาที)
docker compose build

# รัน
docker compose up -d

# ดู status
docker compose ps

# ดู logs
docker compose logs -f
```

รอจนเห็น `Application started` แล้วเปิด browser:
```
http://<EC2_PUBLIC_IP>
```

Login ด้วย: `ADMIN001` / `PCG@2024`

---

## ขั้นตอนที่ 7 — ตั้ง HTTPS (สำคัญมาก — กล้องมือถือต้องการ HTTPS)

### 7.1 ต้องมี Domain ก่อน
ซื้อ domain หรือใช้ที่มีอยู่ → ชี้ DNS (A Record) ไปที่ EC2 IP

ตัวอย่าง: `booking.pcg.co.th` → `<EC2_PUBLIC_IP>`

### 7.2 ติดตั้ง Nginx + Let's Encrypt

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# ตั้งค่า Nginx
sudo tee /etc/nginx/sites-available/pcg-booking << 'EOF'
server {
    listen 80;
    server_name booking.pcg.co.th;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/pcg-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ติดตั้ง SSL Certificate (ฟรี)
sudo certbot --nginx -d booking.pcg.co.th
```

### 7.3 อัปเดต APP_URL

```bash
cd /home/ubuntu/pcg-booking

# แก้ .env
sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://booking.pcg.co.th|' .env

# Rebuild
docker compose build
docker compose up -d
```

เปิดใช้งานได้ที่: `https://booking.pcg.co.th`

---

## ขั้นตอนที่ 8 — Seed ข้อมูลพนักงาน (ครั้งแรก)

```bash
# รัน seed script ภายใน container
docker compose exec app node node_modules/prisma/build/index.js db seed 2>/dev/null || \
docker compose exec app sh -c "cd /app && node -e \"
const { PrismaClient } = require('@prisma/client');
console.log('Database ready');
\""
```

หรือ seed ผ่าน admin panel: Admin → พนักงาน → เพิ่มพนักงานใหม่

---

## การ Update App (ครั้งต่อไป)

```bash
cd /home/ubuntu/pcg-booking

# ดึง code ใหม่ (ถ้าใช้ git)
git pull

# หรือ upload ไฟล์ใหม่ด้วย SCP แล้ว:
docker compose build
docker compose up -d
```

---

## Backup Database

```bash
# Backup
docker compose cp app:/app/prisma/data/pcg.db ./backup-$(date +%Y%m%d).db

# ดาวน์โหลดมาเครื่อง Windows
scp -i pcg-key.pem ubuntu@<EC2_IP>:/home/ubuntu/pcg-booking/backup-*.db .
```

---

## Monitoring & Logs

```bash
# ดู logs realtime
docker compose logs -f app

# ดู resource usage
docker stats

# Restart app
docker compose restart app

# หยุด app
docker compose down
```

---

## ราคา AWS ต่อเดือน

| Service | Spec | ราคา (USD) |
|---------|------|-----------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~$15 |
| EBS 20GB gp3 | Storage | ~$2 |
| Data Transfer | ~1 GB | ~$0.09 |
| **รวม** | | **~$17/เดือน** |

> ถ้าต้องการถูกกว่า: ใช้ **t3.micro** (~$8/เดือน) เหมาะกับพนักงาน < 100 คน

---

## Checklist ก่อน Go Live

- [ ] EC2 สร้างและ SSH ได้
- [ ] Docker รันแล้ว app ขึ้น
- [ ] Domain ชี้มาที่ EC2 แล้ว
- [ ] HTTPS ใช้งานได้ (กล้อง scan QR ทำงาน)
- [ ] Login ด้วย ADMIN001 ได้
- [ ] ตั้งเส้นทางและตารางเดินรถ
- [ ] ตั้งพิกัด GPS จุดรับรถ (Admin → เส้นทาง → ตั้ง GPS)
- [ ] เพิ่มพนักงานทั้งหมด (Admin → พนักงาน)
- [ ] ทดสอบจองและเช็คอินบน iPhone

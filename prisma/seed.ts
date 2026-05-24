import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { format, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('PCG@2024', 10);

  // Admin users
  const admin = await prisma.user.upsert({
    where: { employeeId: 'ADMIN001' },
    update: {},
    create: {
      employeeId: 'ADMIN001',
      name: 'ผู้ดูแลระบบ',
      nameEn: 'System Admin',
      email: 'admin@pcg.co.th',
      department: 'IT',
      role: 'ADMIN',
      password: passwordHash,
    },
  });

  const gaAdmin = await prisma.user.upsert({
    where: { employeeId: 'GA001' },
    update: {},
    create: {
      employeeId: 'GA001',
      name: 'สมชาย ใจดี',
      nameEn: 'Somchai Jaidee',
      email: 'ga@pcg.co.th',
      department: 'General Affairs',
      position: 'GA Manager',
      role: 'GA_ADMIN',
      password: passwordHash,
    },
  });

  // Sample employees
  const employees = [
    { employeeId: 'EMP001', name: 'สมหญิง รักดี', nameEn: 'Somying Rakdee', department: 'Finance', position: 'Accountant' },
    { employeeId: 'EMP002', name: 'วิชัย สมใจ', nameEn: 'Wichai Somjai', department: 'Marketing', position: 'Marketing Executive' },
    { employeeId: 'EMP003', name: 'นารี มีสุข', nameEn: 'Naree Meesuk', department: 'HR', position: 'HR Officer' },
    { employeeId: 'EMP004', name: 'ประยุทธ์ แก้วใส', nameEn: 'Prayuth Kaewsai', department: 'Operations', position: 'Operations Manager' },
    { employeeId: 'EMP005', name: 'ลลิตา สวยงาม', nameEn: 'Lalita Suayngam', department: 'Sales', position: 'Sales Executive' },
    { employeeId: 'EMP006', name: 'อนุชา ขยันดี', nameEn: 'Anucha Khayandie', department: 'IT', position: 'Developer' },
    { employeeId: 'EMP007', name: 'มณีรัตน์ ใสสะอาด', nameEn: 'Maneerat Saisaard', department: 'Finance', position: 'Senior Accountant' },
    { employeeId: 'EMP008', name: 'สุรศักดิ์ บึกบึน', nameEn: 'Surasak Buekbuen', department: 'Operations', position: 'Supervisor' },
    { employeeId: 'EMP009', name: 'พิมพ์ใจ อ่อนโยน', nameEn: 'Phimjai Onyoon', department: 'Marketing', position: 'Designer' },
    { employeeId: 'EMP010', name: 'ธนาวุฒิ มั่งมี', nameEn: 'Thanawut Mangmee', department: 'Sales', position: 'Sales Manager' },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { employeeId: emp.employeeId },
      update: {},
      create: { ...emp, role: 'EMPLOYEE', password: passwordHash },
    });
  }

  // Routes
  const route1 = await prisma.route.upsert({
    where: { id: 'route-onnuch-office' },
    update: {},
    create: {
      id: 'route-onnuch-office',
      name: 'BTS อ่อนนุช → PCG Office',
      origin: 'BTS อ่อนนุช',
      destination: 'PCG Office (สุขุมวิท)',
      description: 'รับที่ป้ายรถเมล์หน้า BTS อ่อนนุช',
      capacity: 25,
    },
  });

  const route2 = await prisma.route.upsert({
    where: { id: 'route-office-onnuch' },
    update: {},
    create: {
      id: 'route-office-onnuch',
      name: 'PCG Office → BTS อ่อนนุช',
      origin: 'PCG Office (สุขุมวิท)',
      destination: 'BTS อ่อนนุช',
      description: 'ออกจาก PCG Office ประตูหน้า',
      capacity: 25,
    },
  });

  const route3 = await prisma.route.upsert({
    where: { id: 'route-latphrao-office' },
    update: {},
    create: {
      id: 'route-latphrao-office',
      name: 'MRT ลาดพร้าว → PCG Office',
      origin: 'MRT ลาดพร้าว',
      destination: 'PCG Office (สุขุมวิท)',
      description: 'รับที่ทางออก 1 MRT ลาดพร้าว',
      capacity: 20,
    },
  });

  const route4 = await prisma.route.upsert({
    where: { id: 'route-office-latphrao' },
    update: {},
    create: {
      id: 'route-office-latphrao',
      name: 'PCG Office → MRT ลาดพร้าว',
      origin: 'PCG Office (สุขุมวิท)',
      destination: 'MRT ลาดพร้าว',
      description: 'ออกจาก PCG Office ประตูหน้า',
      capacity: 20,
    },
  });

  // Create schedules for next 14 days
  const today = new Date();
  const scheduleTemplates = [
    { routeId: route1.id, departAt: '07:30', capacity: 25 },
    { routeId: route1.id, departAt: '08:00', capacity: 25 },
    { routeId: route3.id, departAt: '07:45', capacity: 20 },
    { routeId: route3.id, departAt: '08:15', capacity: 20 },
    { routeId: route2.id, departAt: '17:00', capacity: 25 },
    { routeId: route2.id, departAt: '18:00', capacity: 25 },
    { routeId: route4.id, departAt: '17:30', capacity: 20 },
    { routeId: route4.id, departAt: '18:30', capacity: 20 },
  ];

  for (let i = 0; i < 14; i++) {
    const date = format(addDays(today, i), 'yyyy-MM-dd');
    const dayOfWeek = addDays(today, i).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    for (const tmpl of scheduleTemplates) {
      const id = `sched-${tmpl.routeId}-${date}-${tmpl.departAt.replace(':', '')}`;
      await prisma.schedule.upsert({
        where: { id },
        update: {},
        create: {
          id,
          routeId: tmpl.routeId,
          date,
          departAt: tmpl.departAt,
          capacity: tmpl.capacity,
        },
      });
    }
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Default accounts:');
  console.log('  Admin:    ADMIN001 / PCG@2024');
  console.log('  GA Admin: GA001    / PCG@2024');
  console.log('  Employee: EMP001   / PCG@2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

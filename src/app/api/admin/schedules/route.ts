import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin, todayStr } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || todayStr();
  const routeId = searchParams.get('routeId');

  const schedules = await prisma.schedule.findMany({
    where: {
      date,
      ...(routeId ? { routeId } : {}),
    },
    include: {
      route: true,
      _count: { select: { bookings: { where: { status: { not: 'CANCELLED' } } } } },
    },
    orderBy: { departAt: 'asc' },
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { routeId, date, departAt, capacity } = await request.json();

  if (!routeId || !date || !departAt) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 });
  }

  const route = await prisma.route.findUnique({ where: { id: routeId } });

  const schedule = await prisma.schedule.create({
    data: {
      routeId,
      date,
      departAt,
      capacity: capacity || route?.capacity || 30,
    },
    include: { route: true },
  });

  return NextResponse.json({ schedule }, { status: 201 });
}

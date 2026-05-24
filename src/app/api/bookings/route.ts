import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { todayStr } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const limit = parseInt(searchParams.get('limit') || '50');

  const whereClause: Record<string, unknown> = {
    userId: user.id,
    status: { not: 'CANCELLED' },
  };

  if (date) {
    whereClause.schedule = { date };
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      schedule: { include: { route: true } },
      checkIn: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { scheduleId } = await request.json();

    if (!scheduleId) {
      return NextResponse.json({ error: 'กรุณาเลือกรอบรถ' }, { status: 400 });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId, isActive: true },
      include: {
        bookings: { where: { status: { not: 'CANCELLED' } } },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'ไม่พบรอบรถที่เลือก' }, { status: 404 });
    }

    if (schedule.bookings.length >= schedule.capacity) {
      return NextResponse.json({ error: 'ที่นั่งเต็มแล้ว' }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { userId_scheduleId: { userId: user.id, scheduleId } },
    });

    if (existing) {
      if (existing.status === 'CANCELLED') {
        const updated = await prisma.booking.update({
          where: { id: existing.id },
          data: { status: 'CONFIRMED' },
          include: { schedule: { include: { route: true } } },
        });
        return NextResponse.json({ booking: updated });
      }
      return NextResponse.json({ error: 'คุณจองรอบนี้แล้ว' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: { userId: user.id, scheduleId, status: 'CONFIRMED' },
      include: { schedule: { include: { route: true } } },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

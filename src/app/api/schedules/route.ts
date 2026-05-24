import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { todayStr } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || todayStr();

  const schedules = await prisma.schedule.findMany({
    where: { date, isActive: true },
    include: {
      route: true,
      bookings: {
        where: { status: { not: 'CANCELLED' } },
        select: { id: true, userId: true },
      },
    },
    orderBy: { departAt: 'asc' },
  });

  const result = schedules.map((s) => ({
    id: s.id,
    routeId: s.routeId,
    route: s.route,
    date: s.date,
    departAt: s.departAt,
    capacity: s.capacity,
    bookingCount: s.bookings.length,
    availableSeats: s.capacity - s.bookings.length,
    isBooked: s.bookings.some((b) => b.userId === user.id),
  }));

  return NextResponse.json({ schedules: result });
}

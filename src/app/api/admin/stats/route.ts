import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { todayStr, isAdmin } from '@/lib/utils';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = todayStr();

  const [totalBookingsToday, checkedInToday, activeRoutes, recentBookings, recentCheckIns] =
    await Promise.all([
      prisma.booking.count({
        where: { schedule: { date: today }, status: 'CONFIRMED' },
      }),
      prisma.checkIn.count({
        where: { booking: { schedule: { date: today } } },
      }),
      prisma.route.count({ where: { isActive: true } }),
      prisma.booking.findMany({
        where: { schedule: { date: today } },
        include: {
          user: { select: { employeeId: true, name: true, department: true } },
          schedule: { include: { route: true } },
          checkIn: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.checkIn.findMany({
        where: { booking: { schedule: { date: today } } },
        include: {
          user: { select: { employeeId: true, name: true, department: true } },
          booking: { include: { schedule: { include: { route: true } } } },
        },
        orderBy: { checkedAt: 'desc' },
        take: 10,
      }),
    ]);

  return NextResponse.json({
    totalBookingsToday,
    checkedInToday,
    pendingCheckin: totalBookingsToday - checkedInToday,
    activeRoutes,
    recentBookings,
    recentCheckIns,
  });
}

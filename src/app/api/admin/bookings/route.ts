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
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {
    schedule: { date, ...(routeId ? { routeId } : {}) },
  };

  if (status) where.status = status;

  if (search) {
    where.user = {
      OR: [
        { employeeId: { contains: search } },
        { name: { contains: search } },
      ],
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { employeeId: true, name: true, department: true, phone: true } },
      schedule: { include: { route: true } },
      checkIn: true,
    },
    orderBy: [{ schedule: { departAt: 'asc' } }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ bookings });
}

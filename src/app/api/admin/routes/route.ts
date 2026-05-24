import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/utils';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const routes = await prisma.route.findMany({
    include: {
      _count: { select: { schedules: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ routes });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, origin, destination, description, capacity } = await request.json();

  if (!name || !origin || !destination) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 });
  }

  const route = await prisma.route.create({
    data: { name, origin, destination, description, capacity: capacity || 30 },
  });

  return NextResponse.json({ route }, { status: 201 });
}

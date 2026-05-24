import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const checkIn = await prisma.checkIn.update({
    where: { id: params.id },
    data: {
      verifiedBy: user.name,
      verifiedAt: new Date(),
    },
  });

  return NextResponse.json({ checkIn });
}

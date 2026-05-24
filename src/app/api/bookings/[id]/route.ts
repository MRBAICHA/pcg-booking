import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { checkIn: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 });
  }

  if (booking.userId !== user.id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ยกเลิก' }, { status: 403 });
  }

  if (booking.checkIn) {
    return NextResponse.json({ error: 'ไม่สามารถยกเลิกได้ เนื่องจากเช็คอินแล้ว' }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ success: true });
}

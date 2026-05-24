import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const schedule = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: { route: true },
  });

  if (!schedule) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'svg';

  // QR content: PCG-CHECKIN:{scheduleId}
  const qrContent = `PCG-CHECKIN:${params.id}`;

  if (format === 'png') {
    const buffer = await QRCode.toBuffer(qrContent, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' },
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png' },
    });
  }

  const svg = await QRCode.toString(qrContent, {
    type: 'svg',
    margin: 2,
    color: { dark: '#1e3a8a', light: '#ffffff' },
  });

  // Return JSON with QR + schedule info
  if (format === 'json') {
    return NextResponse.json({
      qrData: qrContent,
      qrSvg: svg,
      schedule: {
        id: schedule.id,
        date: schedule.date,
        departAt: schedule.departAt,
        route: schedule.route,
      },
    });
  }

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}

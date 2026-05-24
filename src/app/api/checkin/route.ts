import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { todayStr } from '@/lib/utils';

// Haversine formula — returns distance in meters between two GPS points
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || todayStr();

  const bookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
      status: 'CONFIRMED',
      schedule: { date },
    },
    include: {
      schedule: { include: { route: true } },
      checkIn: true,
    },
    orderBy: { schedule: { departAt: 'asc' } },
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { bookingId, scheduleId, latitude, longitude, method } = body;

    let targetBookingId = bookingId;

    // QR scan / GPS checkin: find booking by scheduleId
    if (!targetBookingId && scheduleId) {
      const booking = await prisma.booking.findFirst({
        where: { userId: user.id, scheduleId, status: 'CONFIRMED' },
        include: { checkIn: true },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'ไม่พบการจองสำหรับรอบรถนี้ กรุณาจองก่อน' },
          { status: 404 }
        );
      }
      if (booking.checkIn) {
        return NextResponse.json({ error: 'เช็คอินแล้ว' }, { status: 400 });
      }
      targetBookingId = booking.id;
    }

    if (!targetBookingId) {
      return NextResponse.json({ error: 'กรุณาระบุการจอง' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: targetBookingId, userId: user.id, status: 'CONFIRMED' },
      include: {
        checkIn: true,
        schedule: { include: { route: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 });
    if (booking.checkIn) return NextResponse.json({ error: 'เช็คอินแล้ว' }, { status: 400 });

    // GPS Geofence validation (only when method is GPS_CHECKIN)
    if (method === 'GPS_CHECKIN') {
      const route = booking.schedule.route;

      if (!latitude || !longitude) {
        return NextResponse.json(
          { error: 'ไม่พบ GPS กรุณาเปิดตำแหน่งบนมือถือแล้วลองใหม่' },
          { status: 400 }
        );
      }

      // Only validate distance if admin has configured pickup coordinates
      if (route.pickupLat && route.pickupLng) {
        const distance = Math.round(
          haversineMeters(latitude, longitude, route.pickupLat, route.pickupLng)
        );
        const radius = route.pickupRadius || 300;

        if (distance > radius) {
          return NextResponse.json(
            {
              error: `คุณอยู่ห่างจากจุดรับรถ ${distance} เมตร (ต้องอยู่ในรัศมี ${radius} เมตร)`,
              distance,
              radius,
            },
            { status: 400 }
          );
        }
      }
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        bookingId: targetBookingId,
        userId: user.id,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        method: method || (scheduleId ? 'QR_SCAN' : 'MANUAL'),
      },
      include: {
        booking: { include: { schedule: { include: { route: true } } } },
      },
    });

    return NextResponse.json({ checkIn }, { status: 201 });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

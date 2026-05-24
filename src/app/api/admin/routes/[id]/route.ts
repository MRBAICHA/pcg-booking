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

  const body = await request.json();
  const { name, origin, destination, description, capacity, isActive, pickupLat, pickupLng, pickupRadius } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (origin !== undefined) data.origin = origin;
  if (destination !== undefined) data.destination = destination;
  if (description !== undefined) data.description = description;
  if (capacity !== undefined) data.capacity = capacity;
  if (isActive !== undefined) data.isActive = isActive;
  if (pickupLat !== undefined) data.pickupLat = pickupLat;
  if (pickupLng !== undefined) data.pickupLng = pickupLng;
  if (pickupRadius !== undefined) data.pickupRadius = pickupRadius;

  const route = await prisma.route.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ route });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.route.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
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

  try {
    const body = await request.json();
    const { name, nameEn, email, phone, department, position, role, isActive, password } = body;

    const updateData: Record<string, unknown> = {
      name, nameEn, email, phone, department, position, role, isActive,
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const employee = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, employeeId: true, name: true, role: true, isActive: true },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

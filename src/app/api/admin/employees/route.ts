import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const employees = await prisma.user.findMany({
    where: {
      ...(search ? {
        OR: [
          { employeeId: { contains: search } },
          { name: { contains: search } },
          { department: { contains: search } },
        ],
      } : {}),
    },
    select: {
      id: true,
      employeeId: true,
      name: true,
      nameEn: true,
      email: true,
      phone: true,
      department: true,
      position: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { employeeId: 'asc' },
  });

  return NextResponse.json({ employees });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { employeeId, name, nameEn, email, phone, department, position, role, password } = body;

    if (!employeeId || !name || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { employeeId: employeeId.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: 'รหัสพนักงานนี้มีอยู่แล้ว' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const employee = await prisma.user.create({
      data: {
        employeeId: employeeId.toUpperCase(),
        name,
        nameEn: nameEn || undefined,
        email: email || undefined,
        phone: phone || undefined,
        department: department || undefined,
        position: position || undefined,
        role: role || 'EMPLOYEE',
        password: hashed,
      },
    });

    return NextResponse.json({
      employee: { id: employee.id, employeeId: employee.employeeId, name: employee.name },
    }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId: employeeId.toUpperCase(), isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const token = await generateToken({
      userId: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}

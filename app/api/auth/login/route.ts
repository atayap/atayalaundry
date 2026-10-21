// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?').get(email, password) as any;

    if (!user) {
      return NextResponse.json({ success: false, message: 'Email atau password salah!' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Login berhasil', data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
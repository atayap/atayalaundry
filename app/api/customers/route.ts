// app/api/customers/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Nomor telepon diperlukan' }, { status: 400 });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);

    return NextResponse.json({
      success: true,
      data: customer || { deposit_balance: 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
// app/api/admin/status/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const { id, order_status, payment_status } = await request.json();

    if (order_status) {
      db.prepare('UPDATE transactions SET order_status = ? WHERE id = ?').run(order_status, id);
    }
    if (payment_status) {
      db.prepare('UPDATE transactions SET payment_status = ? WHERE id = ?').run(payment_status, id);
    }

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
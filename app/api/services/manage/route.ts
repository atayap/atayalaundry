// app/api/services/manage/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// POST: Tambah Layanan Baru
export async function POST(request: Request) {
  try {
    const { service_name, unit, price_per_unit } = await request.json();

    if (!service_name || !unit || !price_per_unit) {
      return NextResponse.json({ success: false, message: 'Semua kolom wajib diisi!' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO services (service_name, unit, price_per_unit) VALUES (?, ?, ?)');
    stmt.run(service_name, unit, price_per_unit);

    return NextResponse.json({ success: true, message: 'Layanan berhasil ditambahkan' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Layanan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID layanan tidak valid!' }, { status: 400 });
    }

    db.prepare('DELETE FROM services WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
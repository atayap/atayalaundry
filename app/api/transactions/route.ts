// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { customer_name, customer_phone, total_amount, user_id, items } = await request.json();

    if (!customer_name || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Data transaksi tidak lengkap!' }, { status: 400 });
    }

    // Buat kode nota unik berdasarkan tanggal & angka acak (misal: INV-20261022-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoice_code = `INV-${dateStr}-${randomNum}`;

    // Jalankan transaksi database (menggunakan transaction SQLite agar aman)
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (invoice_code, customer_name, customer_phone, total_amount, payment_status, order_status, user_id)
      VALUES (?, ?, ?, ?, 'unpaid', 'pending', ?)
    `);

    const insertDetail = db.prepare(`
      INSERT INTO transaction_details (transaction_id, service_id, qty, subtotal)
      VALUES (?, ?, ?, ?)
    `);

    const executeTransaction = db.transaction((txData, txItems) => {
      const info = insertTransaction.run(
        txData.invoice_code,
        txData.customer_name,
        txData.customer_phone,
        txData.total_amount,
        txData.user_id
      );
      
      const transactionId = info.lastInsertRowid;

      for (const item of txItems) {
        const subtotal = item.price * item.qty;
        insertDetail.run(transactionId, item.service_id, item.qty, subtotal);
      }

      return transactionId;
    });

    executeTransaction(
      { invoice_code, customer_name, customer_phone, total_amount, user_id },
      items
    );

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      invoice_code: invoice_code,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
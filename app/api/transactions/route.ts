// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const {
      customer_name,
      customer_phone,
      items,
      total_amount,
      paid_amount,
      use_deposit,
      save_as_deposit,
    } = await request.json();

    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Cek atau Buat Pelanggan
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(customer_phone) as any;
    if (!customer) {
      const insertCust = db.prepare('INSERT INTO customers (name, phone, deposit_balance) VALUES (?, ?, 0)');
      const result = insertCust.run(customer_name, customer_phone);
      customer = { id: result.lastInsertRowid, deposit_balance: 0 };
    }

    let currentDeposit = customer.deposit_balance || 0;
    let finalPaidAmount = Number(paid_amount) || 0;
    let depositUsed = 0;

    // 2. Jika menggunakan saldo deposit
    if (use_deposit && currentDeposit > 0) {
      if (currentDeposit >= total_amount) {
        depositUsed = total_amount;
        currentDeposit -= total_amount;
      } else {
        depositUsed = currentDeposit;
        currentDeposit = 0;
      }
    }

    // 3. Jika ada kelebihan pembayaran tunai dan dipilih simpan sebagai deposit
    const changeAmount = finalPaidAmount + depositUsed - total_amount;
    if (save_as_deposit && changeAmount > 0) {
      currentDeposit += changeAmount;
    }

    // Update Saldo Pelanggan di Database
    db.prepare('UPDATE customers SET deposit_balance = ?, name = ? WHERE phone = ?').run(
      currentDeposit,
      customer_name,
      customer_phone
    );

    // 4. Simpan Transaksi
    const invoiceCode = `INV-${Date.now()}`;
    const paymentStatus = (finalPaidAmount + depositUsed) >= total_amount ? 'paid' : 'unpaid';

    const insertTx = db.prepare(`
      INSERT INTO transactions (invoice_code, customer_name, customer_phone, total_amount, payment_status, order_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    const txResult = insertTx.run(invoiceCode, customer_name, customer_phone, total_amount, paymentStatus);
    const transactionId = txResult.lastInsertRowid;

    // Simpan Detail Transaksi
    const insertDetail = db.prepare(`
      INSERT INTO transaction_details (transaction_id, service_id, qty, subtotal)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
      insertDetail.run(transactionId, item.service_id, item.qty, item.subtotal);
    }

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      invoice_code: invoiceCode,
      remaining_deposit: currentDeposit,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
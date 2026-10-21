// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Ambil total omzet dan total transaksi
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM transactions
    `).get() as { total_transactions: number; total_revenue: number };

    // Ambil daftar 10 transaksi terakhir
    const recentTransactions = db.prepare(`
      SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10
    `).all();

    return NextResponse.json({
      success: true,
      data: {
        totalTransactions: stats.total_transactions,
        totalRevenue: stats.total_revenue,
        recentTransactions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
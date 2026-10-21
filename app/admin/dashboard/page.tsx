// app/admin/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, DollarSign, ShoppingCart, LogOut, RefreshCw } from 'lucide-react';

interface Transaction {
  id: number;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTotalRevenue(data.data.totalRevenue);
          setTotalTransactions(data.data.totalTransactions);
          setTransactions(data.data.recentTransactions);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      router.push('/cashier');
      return;
    }

    fetchStats();
  }, [router]);

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    // Siklus status: pending -> in_progress -> completed -> taken
    const statuses = ['pending', 'in_progress', 'completed', 'taken'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

    const res = await fetch('/api/admin/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, order_status: nextStatus }),
    });

    if (res.ok) {
      fetchStats(); // Refresh data
    }
  };

  const handleTogglePayment = async (id: number, currentPayment: string) => {
    const nextPayment = currentPayment === 'unpaid' ? 'paid' : 'unpaid';

    const res = await fetch('/api/admin/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, payment_status: nextPayment }),
    });

    if (res.ok) {
      fetchStats(); // Refresh data
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Dashboard Admin Laundry</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchStats}
            className="flex items-center space-x-1 text-sm text-slate-600 hover:text-blue-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Kartu Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Pendapatan</p>
              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                Rp {totalRevenue.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Transaksi Masuk</p>
              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
                {totalTransactions} Nota
              </h2>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Riwayat Transaksi Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                  <th className="p-4">Kode Nota</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status Bayar</th>
                  <th className="p-4">Status Cucian</th>
                  <th className="p-4">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Belum ada riwayat transaksi.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-blue-600">{tx.invoice_code}</td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800">{tx.customer_name}</p>
                        <p className="text-xs text-slate-400">{tx.customer_phone || '-'}</p>
                      </td>
                      <td className="p-4 font-semibold">Rp {tx.total_amount.toLocaleString()}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePayment(tx.id, tx.payment_status)}
                          className={`px-2.5 py-1 text-xs rounded-full font-medium transition ${
                            tx.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.payment_status} (Klik ubah)
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleUpdateStatus(tx.id, tx.order_status)}
                          className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition"
                        >
                          {tx.order_status} 🔄
                        </button>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{tx.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
// app/cashier/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Trash2, ShoppingBag, CheckCircle } from 'lucide-react';

interface Service {
  id: number;
  service_name: string;
  unit: string;
  price_per_unit: number;
}

interface CartItem {
  service_id: number;
  service_name: string;
  unit: string;
  price: number;
  qty: number;
}

export default function CashierPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Cek user login
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    // Ambil data layanan dari API
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      });
  }, [router]);

  const handleAddToCart = () => {
    if (!selectedServiceId) return;
    const service = services.find((s) => s.id === Number(selectedServiceId));
    if (!service) return;

    const existingIndex = cart.findIndex((item) => item.service_id === service.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].qty += qty;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          service_id: service.id,
          service_name: service.service_name,
          unit: service.unit,
          price: service.price_per_unit,
          qty: qty,
        },
      ]);
    }
    setSelectedServiceId('');
    setQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: totalAmount,
          user_id: user.id,
          items: cart,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccessMsg(`Transaksi berhasil! Kode Nota: ${data.invoice_code}`);
      setCustomerName('');
      setCustomerPhone('');
      setCart([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
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
          <ShoppingBag className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Kasir Laundry</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Pelanggan & Item */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Form Transaksi Baru</h2>

          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelanggan</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">Pilih Layanan</label>
              <div className="flex space-x-2">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="">-- Pilih Layanan --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.service_name} (Rp {s.price_per_unit}/{s.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Qty"
                />
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg transition"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Cetak Transaksi'}
              </button>
            </div>
          </form>
        </div>

        {/* Keranjang Belanja */}
        <div className="bg-white p-6 rounded-xl shadow flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Rincian Cucian Masuk</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">Belum ada layanan yang dipilih.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{item.service_name}</p>
                      <p className="text-xs text-slate-500">
                        {item.qty} {item.unit} × Rp {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-700 text-sm">
                        Rp {(item.qty * item.price).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-bold text-slate-700">Total Pembayaran:</span>
              <span className="text-xl font-extrabold text-blue-600">
                Rp {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
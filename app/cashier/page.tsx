// app/cashier/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Trash2, LogOut, Wallet, CheckCircle } from 'lucide-react';

interface Service {
  id: number;
  service_name: string;
  unit: string;
  price_per_unit: number;
}

interface CartItem {
  service_id: number;
  service_name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export default function CashierPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [depositBalance, setDepositBalance] = useState(0);
  const [useDeposit, setUseDeposit] = useState(false);
  const [saveAsDeposit, setSaveAsDeposit] = useState(true);
  const [paidAmount, setPaidAmount] = useState('');
  const [selectedService, setSelectedService] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      });
  }, [router]);

  // Cek saldo deposit pelanggan saat nomor HP diketik
  const handlePhoneChange = async (phone: string) => {
    setCustomerPhone(phone);
    if (phone.length >= 10) {
      try {
        const res = await fetch(`/api/customers?phone=${phone}`);
        const data = await res.json();
        if (data.success && data.data) {
          setDepositBalance(data.data.deposit_balance || 0);
          if (data.data.name) setCustomerName(data.data.name);
        } else {
          setDepositBalance(0);
        }
      } catch {
        setDepositBalance(0);
      }
    } else {
      setDepositBalance(0);
    }
  };

  const handleAddToCart = () => {
    if (!selectedService) return;
    const s = services.find((srv) => srv.id === Number(selectedService));
    if (!s) return;

    const subtotal = s.price_per_unit * qty;
    setCart([...cart, { service_id: s.id, service_name: s.service_name, price: s.price_per_unit, qty, subtotal }]);
    setSelectedService('');
    setQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const effectiveDepositUsed = useDeposit ? Math.min(depositBalance, totalAmount) : 0;
  const netTotal = Math.max(0, totalAmount - effectiveDepositUsed);
  const change = Math.max(0, (Number(paidAmount) || 0) - netTotal);

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Keranjang masih kosong!');
    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          items: cart,
          total_amount: totalAmount,
          paid_amount: Number(paidAmount) || 0,
          use_deposit: useDeposit,
          save_as_deposit: saveAsDeposit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`Transaksi Berhasil!\nKode Nota: ${data.invoice_code}\nSisa Saldo Titipan: Rp ${data.remaining_deposit.toLocaleString()}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaidAmount('');
      setDepositBalance(0);
      setUseDeposit(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Kasir Laundry</h1>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/login');
          }}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form & Keranjang */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Pelanggan */}
          <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-bold text-slate-800">1. Data Pelanggan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon/WA</label>
                <input
                  type="text"
                  required
                  placeholder="08123456789"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                />
              </div>
            </div>

            {/* Info Deposit */}
            {depositBalance > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">Saldo Titipan Pelanggan: <strong>Rp {depositBalance.toLocaleString()}</strong></span>
                </div>
                <label className="flex items-center space-x-2 text-sm text-blue-900 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={useDeposit}
                    onChange={(e) => setUseDeposit(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Gunakan Saldo</span>
                </label>
              </div>
            )}
          </div>

          {/* Pilih Layanan */}
          <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-bold text-slate-800">2. Pilih Layanan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                >
                  <option value="">-- Pilih Layanan --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.service_name} (Rp {s.price_per_unit.toLocaleString()}/{s.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm text-center"
                />
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center flex-1"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabel Keranjang */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                    <th className="p-3">Layanan</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">Keranjang masih kosong.</td>
                    </tr>
                  ) : (
                    cart.map((item, index) => (
                      <tr key={index}>
                        <td className="p-3 font-medium">{item.service_name}</td>
                        <td className="p-3">{item.qty}</td>
                        <td className="p-3 font-semibold">Rp {item.subtotal.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleRemoveFromCart(index)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Pembayaran */}
        <div className="bg-white p-6 rounded-xl shadow space-y-6 h-fit">
          <h2 className="text-lg font-bold text-slate-800">3. Ringkasan Bayar</h2>
          
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Total Tagihan:</span>
              <span className="font-bold text-slate-800">Rp {totalAmount.toLocaleString()}</span>
            </div>

            {useDeposit && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Potongan Saldo:</span>
                <span>- Rp {effectiveDepositUsed.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between text-base font-extrabold text-blue-600">
              <span>Harus Dibayar:</span>
              <span>Rp {netTotal.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmitTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Uang Tunai Diterima (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold text-lg"
              />
            </div>

            {/* Opsi Kelebihan Tunai dijadikan Deposit */}
            {change > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-2">
                <p className="font-semibold text-emerald-800">Kelebihan Uang: Rp {change.toLocaleString()}</p>
                <label className="flex items-center space-x-2 text-emerald-900 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={saveAsDeposit}
                    onChange={(e) => setSaveAsDeposit(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Simpan sisa uang sebagai Saldo Titipan</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{loading ? 'Memproses...' : 'Simpan Transaksi'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
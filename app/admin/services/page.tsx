// app/admin/services/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';

interface Service {
  id: number;
  service_name: string;
  unit: string;
  price_per_unit: number;
}

export default function ManageServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceName, setServiceName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchServices = () => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServices(data.data);
      });
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

    fetchServices();
  }, [router]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/services/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: serviceName,
          unit,
          price_per_unit: Number(price),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setServiceName('');
      setPrice('');
      fetchServices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;

    try {
      const res = await fetch(`/api/services/manage?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      fetchServices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow">
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Kelola Layanan Laundry</h1>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center space-x-1 text-sm text-slate-600 hover:text-blue-600 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>

        {/* Form Tambah Layanan */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Jenis Layanan Baru</h2>
          <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Layanan</label>
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Contoh: Cuci Kering Express"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
              >
                <option value="kg">kg</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Harga per Unit (Rp)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="7000"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tabel Daftar Layanan */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Daftar Layanan Tersedia</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                <th className="p-4">Nama Layanan</th>
                <th className="p-4">Satuan</th>
                <th className="p-4">Harga</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{s.service_name}</td>
                  <td className="p-4 capitalize">{s.unit}</td>
                  <td className="p-4 font-semibold text-blue-600">Rp {s.price_per_unit.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
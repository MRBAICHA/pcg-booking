'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Schedule {
  id: string;
  date: string;
  departAt: string;
  capacity: number;
  isActive: boolean;
  route: { id: string; name: string };
  _count: { bookings: number };
}

interface Route {
  id: string;
  name: string;
  capacity: number;
}

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ routeId: '', date: format(new Date(), 'yyyy-MM-dd'), departAt: '07:30', capacity: 30 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadRoutes(); }, []);
  useEffect(() => { loadSchedules(); }, [date]);

  async function loadRoutes() {
    const res = await fetch('/api/admin/routes');
    if (res.ok) { const { routes } = await res.json(); setRoutes(routes); }
  }

  async function loadSchedules() {
    setLoading(true);
    const res = await fetch(`/api/admin/schedules?date=${date}`);
    if (res.ok) { const { schedules } = await res.json(); setSchedules(schedules); }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); }
    else { setShowForm(false); await loadSchedules(); }
    setSaving(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ตารางเดินรถ</h1>
          <p className="text-gray-500 text-sm mt-1">จัดการรอบรถประจำวัน</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-pcg-blue text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มรอบ
        </button>
      </div>

      {/* Date Picker */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">เลือกวันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-pcg-blue">{schedules.length}</p>
          <p className="text-xs text-gray-500">รอบรถวันนี้</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-green-600">
            {schedules.reduce((sum, s) => sum + (s._count?.bookings || 0), 0)}
          </p>
          <p className="text-xs text-gray-500">ที่จองแล้ว</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">เพิ่มรอบรถใหม่</h2>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">เส้นทาง *</label>
              <select
                value={form.routeId}
                onChange={(e) => {
                  const route = routes.find((r) => r.id === e.target.value);
                  setForm({ ...form, routeId: e.target.value, capacity: route?.capacity || 30 });
                }}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกเส้นทาง</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">วันที่ *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">เวลาออกรถ *</label>
              <input
                type="time"
                value={form.departAt}
                onChange={(e) => setForm({ ...form, departAt: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ที่นั่ง</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                min={1}
                max={100}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">ยกเลิก</button>
              <button type="submit" disabled={saving} className="bg-pcg-blue text-white px-5 py-2 rounded-xl font-medium text-sm disabled:opacity-60">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🚌</p>
          <p className="text-lg">ไม่มีตารางเดินรถวันนี้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => {
            const fillPercent = Math.round(((s._count?.bookings || 0) / s.capacity) * 100);
            return (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-pcg-blue font-black text-sm">{s.departAt}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{s.route.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${fillPercent >= 90 ? 'bg-red-400' : fillPercent >= 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex-shrink-0">
                      {s._count?.bookings || 0}/{s.capacity} ที่นั่ง
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.isActive ? 'เปิด' : 'ปิด'}
                  </span>
                  <button
                    onClick={() => router.push(`/admin/schedules/${s.id}/qr`)}
                    className="flex items-center gap-1.5 bg-pcg-blue/10 text-pcg-blue text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-pcg-blue/20 transition-colors"
                    title="ดู QR Code สำหรับพิมพ์ติดรถ"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    </svg>
                    QR Code
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

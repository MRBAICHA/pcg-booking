'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  user: { employeeId: string; name: string; department?: string };
  schedule: { departAt: string; date: string; route: { name: string; origin: string; destination: string } };
  checkIn?: { checkedAt: string } | null;
}

interface Route {
  id: string;
  name: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [routeId, setRouteId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadRoutes(); }, []);
  useEffect(() => { loadBookings(); }, [date, routeId]);

  async function loadRoutes() {
    const res = await fetch('/api/admin/routes');
    if (res.ok) {
      const { routes } = await res.json();
      setRoutes(routes);
    }
  }

  async function loadBookings() {
    setLoading(true);
    const params = new URLSearchParams({ date, ...(routeId && { routeId }), ...(search && { search }) });
    const res = await fetch(`/api/admin/bookings?${params}`);
    if (res.ok) {
      const { bookings } = await res.json();
      setBookings(bookings);
    }
    setLoading(false);
  }

  const totalChecked = bookings.filter((b) => b.checkIn).length;
  const totalPending = bookings.filter((b) => !b.checkIn && b.status === 'CONFIRMED').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">การจองทั้งหมด</h1>
        <p className="text-gray-500 text-sm mt-1">ตรวจสอบการจองรถรับส่งของพนักงาน</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">วันที่</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">เส้นทาง</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทุกเส้นทาง</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">ค้นหา</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="รหัส/ชื่อพนักงาน"
                onKeyDown={(e) => e.key === 'Enter' && loadBookings()}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={loadBookings}
                className="bg-pcg-blue text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                ค้นหา
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-black text-pcg-blue">{bookings.length}</p>
            <p className="text-xs text-gray-500">จองทั้งหมด</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{totalChecked}</p>
            <p className="text-xs text-gray-500">เช็คอินแล้ว</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-500">{totalPending}</p>
            <p className="text-xs text-gray-500">รอเช็คอิน</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">ไม่มีข้อมูลการจอง</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">พนักงาน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เส้นทาง</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เวลา</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เช็คอิน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">{b.user.name}</p>
                      <p className="text-xs text-gray-400">{b.user.employeeId} • {b.user.department || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{b.schedule.route.name}</p>
                      <p className="text-xs text-gray-400">{b.schedule.route.origin} → {b.schedule.route.destination}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-pcg-blue">{b.schedule.departAt}</span>
                    </td>
                    <td className="px-4 py-3">
                      {b.checkIn ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                            {new Date(b.checkIn.checkedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        b.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'ยืนยันแล้ว' : b.status === 'CANCELLED' ? 'ยกเลิก' : 'เสร็จสิ้น'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

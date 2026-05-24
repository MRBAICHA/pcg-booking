'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface CheckIn {
  id: string;
  checkedAt: string;
  method: string;
  latitude?: number | null;
  longitude?: number | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  user: { employeeId: string; name: string; department?: string };
  booking: {
    schedule: { departAt: string; date: string; route: { name: string } };
  };
}

interface Route {
  id: string;
  name: string;
}

export default function AdminCheckinsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [routeId, setRouteId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadRoutes(); }, []);
  useEffect(() => { loadCheckIns(); }, [date, routeId]);

  async function loadRoutes() {
    const res = await fetch('/api/admin/routes');
    if (res.ok) {
      const { routes } = await res.json();
      setRoutes(routes);
    }
  }

  async function loadCheckIns() {
    setLoading(true);
    const params = new URLSearchParams({ date, ...(routeId && { routeId }), ...(search && { search }) });
    const res = await fetch(`/api/admin/checkins?${params}`);
    if (res.ok) {
      const { checkIns } = await res.json();
      setCheckIns(checkIns);
    }
    setLoading(false);
  }

  async function handleVerify(id: string) {
    setVerifying(id);
    try {
      const res = await fetch(`/api/admin/checkins/${id}`, { method: 'PUT' });
      if (res.ok) {
        await loadCheckIns();
      }
    } finally {
      setVerifying(null);
    }
  }

  const verified = checkIns.filter((c) => c.verifiedBy).length;
  const unverified = checkIns.length - verified;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">รายการเช็คอิน</h1>
        <p className="text-gray-500 text-sm mt-1">ตรวจสอบและยืนยันการขึ้นรถของพนักงาน</p>
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
                onKeyDown={(e) => e.key === 'Enter' && loadCheckIns()}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={loadCheckIns} className="bg-pcg-blue text-white px-4 py-2 rounded-xl text-sm font-medium">ค้นหา</button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{checkIns.length}</p>
            <p className="text-xs text-gray-500">เช็คอินทั้งหมด</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-pcg-blue">{verified}</p>
            <p className="text-xs text-gray-500">ยืนยันแล้ว</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-500">{unverified}</p>
            <p className="text-xs text-gray-500">รอยืนยัน</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : checkIns.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-lg">ไม่มีข้อมูลการเช็คอิน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">พนักงาน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เส้นทาง</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">รอบรถ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เวลาเช็คอิน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">การยืนยัน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {checkIns.map((ci) => (
                  <tr key={ci.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">{ci.user.name}</p>
                      <p className="text-xs text-gray-400">{ci.user.employeeId} • {ci.user.department || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{ci.booking.schedule.route.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-pcg-blue">{ci.booking.schedule.departAt}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-700">
                        {new Date(ci.checkedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          ci.method === 'QR_SCAN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {ci.method === 'QR_SCAN' ? '📷 QR' : '👆 Manual'}
                        </span>
                        {ci.latitude && ci.longitude ? (
                          <a
                            href={`https://maps.google.com/?q=${ci.latitude},${ci.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 flex items-center gap-0.5 hover:underline"
                          >
                            📍 GPS
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">ไม่มี GPS</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ci.verifiedBy ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            ✓ ยืนยันแล้ว
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">โดย {ci.verifiedBy}</p>
                        </div>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                          รอยืนยัน
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!ci.verifiedBy && (
                        <button
                          onClick={() => handleVerify(ci.id)}
                          disabled={verifying === ci.id}
                          className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg
                                     hover:bg-green-600 disabled:opacity-60 transition-colors"
                        >
                          {verifying === ci.id ? '...' : 'ยืนยัน'}
                        </button>
                      )}
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

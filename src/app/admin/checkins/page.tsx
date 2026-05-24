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
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

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
      // expand all groups by default
      const names = new Set<string>(checkIns.map((c: CheckIn) => c.booking.schedule.route.name));
      setExpandedRoutes(names);
    }
    setLoading(false);
  }

  async function handleVerify(id: string) {
    setVerifying(id);
    try {
      const res = await fetch(`/api/admin/checkins/${id}`, { method: 'PUT' });
      if (res.ok) await loadCheckIns();
    } finally {
      setVerifying(null);
    }
  }

  function toggleRoute(name: string) {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  // Group by route name
  const grouped = checkIns.reduce<Record<string, CheckIn[]>>((acc, ci) => {
    const name = ci.booking.schedule.route.name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(ci);
    return acc;
  }, {});

  const routeNames = Object.keys(grouped).sort();
  const totalVerified = checkIns.filter((c) => c.verifiedBy).length;

  const filtered = search
    ? checkIns.filter(
        (c) =>
          c.user.employeeId.toLowerCase().includes(search.toLowerCase()) ||
          c.user.name.toLowerCase().includes(search.toLowerCase())
      )
    : checkIns;

  const filteredGrouped = filtered.reduce<Record<string, CheckIn[]>>((acc, ci) => {
    const name = ci.booking.schedule.route.name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(ci);
    return acc;
  }, {});

  const filteredRouteNames = Object.keys(filteredGrouped).sort();

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

        {/* Summary totals */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{checkIns.length}</p>
            <p className="text-xs text-gray-500">เช็คอินทั้งหมด</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-pcg-blue">{totalVerified}</p>
            <p className="text-xs text-gray-500">ยืนยันแล้ว</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-500">{checkIns.length - totalVerified}</p>
            <p className="text-xs text-gray-500">รอยืนยัน</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-600">{routeNames.length}</p>
            <p className="text-xs text-gray-500">สายรถ</p>
          </div>
        </div>
      </div>

      {/* Route summary cards */}
      {!loading && routeNames.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {routeNames.map((name) => {
            const items = grouped[name];
            const vCount = items.filter((c) => c.verifiedBy).length;
            return (
              <div key={name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 truncate mb-2">{name}</p>
                <p className="text-3xl font-black text-pcg-blue">{items.length}</p>
                <p className="text-xs text-gray-400 mt-1">คน</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600 font-medium">✓ {vCount}</span>
                  <span className="text-amber-500 font-medium">⏳ {items.length - vCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grouped tables */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRouteNames.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg">ไม่มีข้อมูลการเช็คอิน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRouteNames.map((name) => {
            const items = filteredGrouped[name];
            const vCount = items.filter((c) => c.verifiedBy).length;
            const isExpanded = expandedRoutes.has(name);
            const departAt = items[0]?.booking.schedule.departAt;

            return (
              <div key={name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Route header */}
                <button
                  onClick={() => toggleRoute(name)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-base font-bold text-slate-800">{name}</p>
                      {departAt && <p className="text-xs text-gray-400">รอบ {departAt} น.</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-pcg-blue text-white text-sm font-bold px-3 py-1 rounded-full">
                        {items.length} คน
                      </span>
                      {vCount > 0 && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                          ✓ {vCount}
                        </span>
                      )}
                      {items.length - vCount > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">
                          ⏳ {items.length - vCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Check-in rows */}
                {isExpanded && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">พนักงาน</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">เวลาเช็คอิน</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">การยืนยัน</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {items.map((ci) => (
                          <tr key={ci.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-700">{ci.user.name}</p>
                              <p className="text-xs text-gray-400">{ci.user.employeeId} • {ci.user.department || '-'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700">
                                {new Date(ci.checkedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  ci.method === 'QR_SCAN' ? 'bg-blue-100 text-blue-700' :
                                  ci.method === 'GPS_CHECKIN' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {ci.method === 'QR_SCAN' ? '📷 QR' : ci.method === 'GPS_CHECKIN' ? '📍 GPS' : '👆 Manual'}
                                </span>
                                {ci.latitude && ci.longitude ? (
                                  <a
                                    href={`https://maps.google.com/?q=${ci.latitude},${ci.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-600 hover:underline"
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
                                  className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-60 transition-colors"
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
            );
          })}
        </div>
      )}
    </div>
  );
}

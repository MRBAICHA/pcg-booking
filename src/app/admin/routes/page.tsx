'use client';

import { useEffect, useState } from 'react';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  description?: string | null;
  capacity: number;
  isActive: boolean;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupRadius: number;
  _count?: { schedules: number };
}

const emptyForm = { name: '', origin: '', destination: '', description: '', capacity: 30 };

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // GPS setup state
  const [gpsRoute, setGpsRoute] = useState<Route | null>(null);
  const [gpsForm, setGpsForm] = useState({ lat: '', lng: '', radius: '300' });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsSaving, setGpsSaving] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [mapsUrlError, setMapsUrlError] = useState('');

  useEffect(() => { loadRoutes(); }, []);

  async function loadRoutes() {
    const res = await fetch('/api/admin/routes');
    if (res.ok) {
      const { routes } = await res.json();
      setRoutes(routes);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); }
    else { setShowForm(false); setForm(emptyForm); await loadRoutes(); }
    setSaving(false);
  }

  async function toggleActive(route: Route) {
    await fetch(`/api/admin/routes/${route.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !route.isActive }),
    });
    await loadRoutes();
  }

  function openGpsPanel(route: Route) {
    setGpsRoute(route);
    setGpsForm({
      lat: route.pickupLat?.toString() || '',
      lng: route.pickupLng?.toString() || '',
      radius: route.pickupRadius?.toString() || '300',
    });
    setGpsError('');
    setMapsUrl('');
    setMapsUrlError('');
  }

  function parseMapsUrl(url: string) {
    setMapsUrlError('');
    // Supports formats:
    // https://maps.google.com/?q=13.7563,100.5018
    // https://www.google.com/maps/@13.7563,100.5018,17z
    // https://www.google.com/maps/place/.../@13.7563,100.5018,...
    // plain "13.7563,100.5018"
    const patterns = [
      /[?&]q=([-\d.]+),([-\d.]+)/,
      /@([-\d.]+),([-\d.]+)/,
      /^([-\d.]+),\s*([-\d.]+)$/,
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m) {
        setGpsForm((f) => ({ ...f, lat: parseFloat(m[1]).toFixed(6), lng: parseFloat(m[2]).toFixed(6) }));
        return;
      }
    }
    setMapsUrlError('ไม่พบพิกัดใน URL นี้ — ลองคัดลอก URL จาก Google Maps ใหม่');
  }

  function detectCurrentGPS() {
    setGpsDetecting(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setGpsDetecting(false);
      },
      () => {
        setGpsError('ไม่สามารถรับ GPS ได้ — กรอกพิกัดด้วยตนเอง');
        setGpsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function saveGPS() {
    if (!gpsRoute) return;
    const lat = parseFloat(gpsForm.lat);
    const lng = parseFloat(gpsForm.lng);
    const radius = parseInt(gpsForm.radius);
    if (isNaN(lat) || isNaN(lng)) { setGpsError('พิกัดไม่ถูกต้อง'); return; }

    setGpsSaving(true);
    const res = await fetch(`/api/admin/routes/${gpsRoute.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupLat: lat, pickupLng: lng, pickupRadius: radius }),
    });
    if (res.ok) { setGpsRoute(null); await loadRoutes(); }
    else { setGpsError('บันทึกไม่สำเร็จ'); }
    setGpsSaving(false);
  }

  async function clearGPS(route: Route) {
    await fetch(`/api/admin/routes/${route.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupLat: null, pickupLng: null }),
    });
    await loadRoutes();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการเส้นทาง</h1>
          <p className="text-gray-500 text-sm mt-1">เส้นทางรถรับส่งพนักงาน</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-pcg-blue text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มเส้นทาง
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">เพิ่มเส้นทางใหม่</h2>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อเส้นทาง *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น BTS อ่อนนุช → PCG Office" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">จำนวนที่นั่ง</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                min={1} max={100}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">จุดรับ *</label>
              <input type="text" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="เช่น BTS อ่อนนุช" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">จุดส่ง *</label>
              <input type="text" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="เช่น PCG Office" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">รายละเอียด</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">ยกเลิก</button>
              <button type="submit" disabled={saving} className="bg-pcg-blue text-white px-5 py-2 rounded-xl font-medium text-sm disabled:opacity-60">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GPS Setup Panel */}
      {gpsRoute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-slate-800 mb-0.5">ตั้งจุดรับ GPS</h2>
            <p className="text-sm text-gray-500 mb-4">{gpsRoute.name}</p>

            {gpsError && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{gpsError}</div>}

            {/* Method 1: Paste Google Maps URL */}
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-blue-800 mb-2">วิธีที่ 1 — วางลิงก์ Google Maps (ง่ายที่สุด)</p>
              <ol className="text-xs text-blue-700 space-y-1 mb-3 list-decimal list-inside">
                <li>เปิด <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Maps</a></li>
                <li>ค้นหาจุดรับรถ</li>
                <li>คลิกขวาที่จุดนั้น → "คัดลอกพิกัด" หรือ คัดลอก URL จากแถบที่อยู่</li>
                <li>วางด้านล่างแล้วกด "ดึงพิกัด"</li>
              </ol>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="วาง URL หรือพิกัด เช่น 13.7563, 100.5018"
                  className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  onClick={() => parseMapsUrl(mapsUrl)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
                >
                  ดึงพิกัด
                </button>
              </div>
              {mapsUrlError && <p className="text-red-600 text-xs mt-2">{mapsUrlError}</p>}
            </div>

            {/* Method 2: Auto detect GPS (works on mobile/HTTPS) */}
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-green-800 mb-2">วิธีที่ 2 — ใช้ GPS อุปกรณ์ (ต้องยืนที่จุดรับรถจริง)</p>
              <button
                onClick={detectCurrentGPS}
                disabled={gpsDetecting}
                className="w-full bg-green-500 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {gpsDetecting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังรับ GPS...</>
                ) : (
                  <>📍 ใช้ตำแหน่งปัจจุบัน</>
                )}
              </button>
              <p className="text-xs text-green-700 mt-2 text-center">ใช้บน มือถือ / Laptop ที่มี GPS เท่านั้น</p>
            </div>

            {/* Coordinates display & edit */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Latitude {gpsForm.lat && <span className="text-green-600">✓</span>}</label>
                <input type="text" value={gpsForm.lat}
                  onChange={(e) => setGpsForm({ ...gpsForm, lat: e.target.value })}
                  placeholder="13.756300"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${gpsForm.lat ? 'border-green-300 bg-green-50' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Longitude {gpsForm.lng && <span className="text-green-600">✓</span>}</label>
                <input type="text" value={gpsForm.lng}
                  onChange={(e) => setGpsForm({ ...gpsForm, lng: e.target.value })}
                  placeholder="100.501800"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${gpsForm.lng ? 'border-green-300 bg-green-50' : 'border-gray-200'}`} />
              </div>
            </div>

            {gpsForm.lat && gpsForm.lng && (
              <a href={`https://maps.google.com/?q=${gpsForm.lat},${gpsForm.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="block text-center text-xs text-blue-600 underline mb-3">
                ✓ ตรวจสอบตำแหน่งบน Google Maps →
              </a>
            )}

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1 block">รัศมี — พนักงานต้องอยู่ภายใน</label>
              <select value={gpsForm.radius} onChange={(e) => setGpsForm({ ...gpsForm, radius: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="100">100 ม. (เข้มงวดมาก)</option>
                <option value="200">200 ม. (เข้มงวด)</option>
                <option value="300">300 ม. (แนะนำ)</option>
                <option value="500">500 ม. (ผ่อนปรน)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setGpsRoute(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={saveGPS} disabled={gpsSaving || !gpsForm.lat || !gpsForm.lng}
                className="flex-1 bg-pcg-blue text-white px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60">
                {gpsSaving ? 'บันทึก...' : 'บันทึกพิกัด'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routes List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800">{route.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${route.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {route.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                    {route.pickupLat ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        📍 GPS ตั้งแล้ว ({route.pickupRadius}ม.)
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                        ⚠ ยังไม่ตั้ง GPS
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{route.origin}</span>{' → '}<span className="font-medium">{route.destination}</span>
                  </p>
                  {route.description && <p className="text-xs text-gray-400 mt-0.5">{route.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">ที่นั่ง: {route.capacity} คน • ตารางเดินรถ: {route._count?.schedules || 0} รอบ</p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => openGpsPanel(route)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    📍 ตั้ง GPS
                  </button>
                  {route.pickupLat && (
                    <button
                      onClick={() => clearGPS(route)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      ลบ GPS
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(route)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${route.isActive ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    {route.isActive ? 'ปิด' : 'เปิด'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

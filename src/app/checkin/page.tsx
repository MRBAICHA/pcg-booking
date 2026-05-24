'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MobileHeader from '@/components/MobileHeader';
import { formatDateThai, formatTime } from '@/lib/utils';
import { format } from 'date-fns';

interface Booking {
  id: string;
  status: string;
  schedule: {
    id: string;
    departAt: string;
    date: string;
    route: { name: string; origin: string; destination: string; pickupLat?: number | null; pickupLng?: number | null; pickupRadius: number };
  };
  checkIn?: {
    id: string;
    checkedAt: string;
    method: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

export default function CheckinPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'waiting' | 'ok' | 'denied'>('waiting');
  const gpsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadBookings();

    // Start watching GPS immediately
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        gpsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGpsStatus('ok');
      },
      () => { if (!gpsRef.current) setGpsStatus('denied'); },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkin?date=${today}`);
      if (!res.ok) { router.push('/login'); return; }
      const { bookings } = await res.json();
      setBookings(bookings || []);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleGPSCheckin(booking: Booking) {
    const gps = gpsRef.current;
    if (!gps) {
      setError('ยังไม่ได้รับ GPS กรุณารอสักครู่หรือเปิดการใช้ตำแหน่งบนมือถือ');
      return;
    }

    setCheckingIn(booking.id);
    setError('');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: booking.schedule.id,
          latitude: gps.latitude,
          longitude: gps.longitude,
          method: 'GPS_CHECKIN',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
      } else {
        await loadBookings();
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setCheckingIn(null);
    }
  }

  async function handleManualCheckin(bookingId: string) {
    setCheckingIn(bookingId);
    setError('');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, method: 'MANUAL' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); }
      else { await loadBookings(); }
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setCheckingIn(null);
    }
  }

  const checkedCount = bookings.filter((b) => b.checkIn).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileHeader title="เช็คอิน" subtitle={formatDateThai(today)} />

      <div className="px-4 py-4 space-y-4">

        {/* GPS Status Bar */}
        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
          gpsStatus === 'ok' ? 'bg-green-50 border border-green-200' :
          gpsStatus === 'denied' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {gpsStatus === 'ok' && (
            <><span className="text-lg">📍</span><p className="text-green-700 text-sm font-medium">GPS พร้อม — กดปุ่มเช็คอินด้านล่างได้เลย</p></>
          )}
          {gpsStatus === 'denied' && (
            <><span className="text-lg">⚠️</span><p className="text-red-700 text-sm">GPS ถูกปิด — ใช้ "สแกน QR" หรือเปิดตำแหน่งในการตั้งค่า</p></>
          )}
          {gpsStatus === 'waiting' && (
            <><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" /><p className="text-blue-700 text-sm">กำลังรับสัญญาณ GPS... (กรุณา Allow ตำแหน่ง)</p></>
          )}
        </div>

        {/* QR Scan Button */}
        <button
          onClick={() => router.push('/checkin/scan')}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4
                     shadow-lg shadow-green-500/25 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
              📷
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-bold">สแกน QR ขึ้นรถ</p>
              <p className="text-green-100 text-xs mt-0.5">เล็งกล้องที่ QR Code บนรถ</p>
            </div>
            <svg className="w-5 h-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>

        {/* Stats */}
        {bookings.length > 0 && (
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
              <p className="text-2xl font-black text-pcg-blue">{bookings.length}</p>
              <p className="text-xs text-gray-500">จองวันนี้</p>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
              <p className="text-2xl font-black text-green-600">{checkedCount}</p>
              <p className="text-xs text-gray-500">เช็คอินแล้ว</p>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
              <p className="text-2xl font-black text-amber-500">{bookings.length - checkedCount}</p>
              <p className="text-xs text-gray-500">รอเช็คอิน</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Booking List */}
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">การจองวันนี้</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-4xl mb-3">🚌</p>
              <p className="text-gray-500 font-medium">ไม่มีการจองวันนี้</p>
              <button onClick={() => router.push('/booking')}
                className="mt-4 bg-pcg-blue text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
                ไปจองรถ
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const isCheckedIn = !!b.checkIn;
                const isQR = b.checkIn?.method === 'QR_SCAN';
                const isGPS = b.checkIn?.method === 'GPS_CHECKIN';
                const hasGPS = !!(b.checkIn?.latitude && b.checkIn?.longitude);
                const hasPickupGPS = !!b.schedule.route.pickupLat;
                const isThisChecking = checkingIn === b.id || checkingIn === b.schedule.id;
                const gpsButtonReady = gpsStatus === 'ok';

                return (
                  <div key={b.id}
                    className={`bg-white rounded-2xl shadow-sm border ${isCheckedIn ? 'border-green-200' : 'border-gray-100'}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-3xl font-bold text-pcg-blue">{b.schedule.departAt}</span>
                          <span className="text-gray-400 text-sm ml-1">น.</span>
                        </div>
                        {isCheckedIn && (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                            เช็คอินแล้ว
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-slate-800">{b.schedule.route.name}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {b.schedule.route.origin} → {b.schedule.route.destination}
                      </p>

                      {isCheckedIn && b.checkIn && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">เวลาเช็คอิน:</span>
                            <span className="text-xs font-semibold text-green-600">
                              {formatTime(new Date(b.checkIn.checkedAt))} น.
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isQR ? 'bg-blue-100 text-blue-700' :
                              isGPS ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {isQR ? '📷 QR' : isGPS ? '📍 GPS' : '👆 Manual'}
                            </span>
                            {hasGPS && b.checkIn.latitude && b.checkIn.longitude && (
                              <a href={`https://maps.google.com/?q=${b.checkIn.latitude},${b.checkIn.longitude}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-500 underline">
                                ดูตำแหน่ง
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {!isCheckedIn && (
                        <div className="mt-4 space-y-2">
                          {/* GPS Check-in — always visible */}
                          <button
                            onClick={() => handleGPSCheckin(b)}
                            disabled={!!checkingIn || !gpsButtonReady}
                            className={`w-full py-3.5 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                              gpsButtonReady
                                ? 'bg-pcg-blue text-white active:bg-blue-900'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isThisChecking ? (
                              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังตรวจสอบ GPS...</>
                            ) : gpsButtonReady ? (
                              <>{hasPickupGPS ? '📍 เช็คอินด้วย GPS' : '📍 เช็คอิน (บันทึก GPS)'}</>
                            ) : (
                              <>{gpsStatus === 'denied' ? '📍 GPS ถูกปิด' : '📍 กำลังรับ GPS...'}</>
                            )}
                          </button>
                          {!hasPickupGPS && gpsButtonReady && (
                            <p className="text-xs text-center text-gray-400">บันทึกตำแหน่งไว้ (ยังไม่ตรวจสอบรัศมี)</p>
                          )}

                          <div className="flex gap-2">
                            <button onClick={() => router.push('/checkin/scan')}
                              className="flex-1 py-2.5 bg-green-500 text-white font-semibold text-sm rounded-xl active:bg-green-600 flex items-center justify-center gap-1.5">
                              <span>📷</span> สแกน QR
                            </button>
                            <button onClick={() => handleManualCheckin(b.id)}
                              disabled={!!checkingIn}
                              className="px-4 py-2.5 bg-gray-100 text-gray-600 font-medium text-sm rounded-xl active:bg-gray-200 disabled:opacity-60">
                              {isThisChecking ? '...' : 'กดเอง'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

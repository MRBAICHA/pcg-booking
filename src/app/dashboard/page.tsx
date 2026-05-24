'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MobileHeader from '@/components/MobileHeader';
import { formatDateThai, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';

interface User {
  name: string;
  employeeId: string;
  department?: string | null;
  role: string;
}

interface Booking {
  id: string;
  status: string;
  schedule: {
    departAt: string;
    date: string;
    route: { name: string; origin: string; destination: string };
  };
  checkIn?: { checkedAt: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    async function load() {
      try {
        const [userRes, bookingsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/bookings?date=${today.toISOString().split('T')[0]}`),
        ]);

        if (!userRes.ok) { router.push('/login'); return; }

        const { user } = await userRes.json();
        const { bookings } = await bookingsRes.json();

        setUser(user);
        setBookings(bookings || []);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const todayStr = today.toISOString().split('T')[0];
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="PCG Car Booking"
        userName={user?.name}
        showLogout
      />

      <div className="px-4 py-4 space-y-4">
        {/* Date Card */}
        <div className="bg-gradient-to-r from-pcg-blue to-blue-600 rounded-2xl p-4 text-white shadow-md">
          <p className="text-blue-200 text-xs font-medium">วันนี้</p>
          <p className="text-xl font-bold mt-0.5">วัน{thaiDays[today.getDay()]}</p>
          <p className="text-blue-100 text-sm">{formatDateThai(todayStr)}</p>
          {user && (
            <div className="mt-3 pt-3 border-t border-blue-500/50 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{user.name}</p>
                <p className="text-blue-200 text-xs">{user.employeeId} • {user.department || 'PCG'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/booking')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-pcg-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-700">จองรถ</p>
          </button>

          <button
            onClick={() => router.push('/checkin')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-700">เช็คอิน</p>
          </button>

          <button
            onClick={() => router.push('/history')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-700">ประวัติ</p>
          </button>
        </div>

        {/* Today's Bookings */}
        <div>
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
            การจองวันนี้
          </h2>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">ยังไม่มีการจองวันนี้</p>
              <button
                onClick={() => router.push('/booking')}
                className="mt-3 text-pcg-blue text-sm font-semibold"
              >
                จองรถเลย →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-pcg-blue">{b.schedule.departAt}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(b.status)}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{b.schedule.route.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {b.schedule.route.origin} → {b.schedule.route.destination}
                      </p>
                    </div>
                    {b.checkIn ? (
                      <div className="flex flex-col items-end">
                        <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs text-green-600 mt-1 font-medium">เช็คอินแล้ว</p>
                        <p className="text-xs text-gray-400">
                          {formatTime(new Date(b.checkIn.checkedAt))} น.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => router.push('/checkin')}
                        className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:bg-green-600"
                      >
                        เช็คอิน
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

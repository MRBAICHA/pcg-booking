'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MobileHeader from '@/components/MobileHeader';
import { formatDateThai, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  schedule: {
    departAt: string;
    date: string;
    route: { name: string; origin: string; destination: string };
  };
  checkIn?: { checkedAt: string } | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/bookings?limit=50');
        if (!res.ok) { router.push('/login'); return; }
        const { bookings } = await res.json();
        setBookings(bookings || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const date = b.schedule.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileHeader title="ประวัติการจอง" subtitle="รายการย้อนหลัง 50 รายการ" />

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">ยังไม่มีประวัติการจอง</p>
            <button
              onClick={() => router.push('/booking')}
              className="mt-4 text-pcg-blue font-semibold text-sm"
            >
              ไปจองรถ →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2">
                    {formatDateThai(date)}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="space-y-2.5">
                  {grouped[date].map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-pcg-blue font-bold text-sm">{b.schedule.departAt}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 text-sm">{b.schedule.route.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {b.schedule.route.origin} → {b.schedule.route.destination}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(b.status)}`}>
                            {getStatusLabel(b.status)}
                          </span>
                          {b.checkIn && (
                            <p className="text-xs text-green-600 mt-1">
                              เช็คอิน {formatTime(new Date(b.checkIn.checkedAt))} น.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

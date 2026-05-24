'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import MobileHeader from '@/components/MobileHeader';
import { formatDateThai } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface Schedule {
  id: string;
  departAt: string;
  date: string;
  capacity: number;
  bookingCount: number;
  availableSeats: number;
  isBooked: boolean;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
  };
}

export default function BookingPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'dd/MM') };
  });

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  async function loadSchedules() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/schedules?date=${selectedDate}`);
      if (!res.ok) { router.push('/login'); return; }
      const { schedules } = await res.json();
      setSchedules(schedules || []);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(scheduleId: string) {
    setBookingId(scheduleId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
      } else {
        setSuccess('จองสำเร็จ!');
        await loadSchedules();
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setBookingId(null);
    }
  }

  const morningSchedules = schedules.filter((s) => parseInt(s.departAt) < 12);
  const afternoonSchedules = schedules.filter((s) => parseInt(s.departAt) >= 12);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileHeader title="จองรถ" subtitle="เลือกวันและรอบที่ต้องการ" />

      {/* Date Picker */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedDate === d.value
                  ? 'bg-pcg-blue text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {d.value === format(new Date(), 'yyyy-MM-dd') ? 'วันนี้' : d.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{formatDateThai(selectedDate)}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm text-center font-medium">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <p className="text-gray-500">ไม่มีรอบรถในวันนี้</p>
          </div>
        ) : (
          <>
            {morningSchedules.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ขาไป (เช้า)</h3>
                <div className="space-y-3">
                  {morningSchedules.map((s) => (
                    <ScheduleCard key={s.id} schedule={s} onBook={handleBook} loading={bookingId === s.id} />
                  ))}
                </div>
              </div>
            )}

            {afternoonSchedules.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ขากลับ (เย็น)</h3>
                <div className="space-y-3">
                  {afternoonSchedules.map((s) => (
                    <ScheduleCard key={s.id} schedule={s} onBook={handleBook} loading={bookingId === s.id} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function ScheduleCard({
  schedule,
  onBook,
  loading,
}: {
  schedule: Schedule;
  onBook: (id: string) => void;
  loading: boolean;
}) {
  const isFull = schedule.availableSeats <= 0;
  const fillPercent = Math.round((schedule.bookingCount / schedule.capacity) * 100);

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${schedule.isBooked ? 'border-blue-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-pcg-blue">{schedule.departAt}</span>
            {schedule.isBooked && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                จองแล้ว
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700">{schedule.route.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {schedule.route.origin} → {schedule.route.destination}
          </p>

          {/* Capacity bar */}
          <div className="mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  fillPercent >= 90 ? 'bg-red-400' : fillPercent >= 70 ? 'bg-amber-400' : 'bg-green-400'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              ว่าง {schedule.availableSeats}/{schedule.capacity} ที่นั่ง
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {schedule.isBooked ? (
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
          ) : isFull ? (
            <span className="text-xs bg-red-50 text-red-500 px-3 py-2 rounded-xl font-medium">เต็ม</span>
          ) : (
            <button
              onClick={() => onBook(schedule.id)}
              disabled={loading}
              className="bg-pcg-blue text-white font-semibold text-sm px-4 py-2 rounded-xl
                         active:bg-blue-900 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? '...' : 'จอง'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

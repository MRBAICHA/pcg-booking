'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/lib/utils';

interface Stats {
  totalBookingsToday: number;
  checkedInToday: number;
  pendingCheckin: number;
  activeRoutes: number;
  recentBookings: Array<{
    id: string;
    status: string;
    user: { employeeId: string; name: string; department?: string };
    schedule: { departAt: string; route: { name: string } };
    checkIn?: { checkedAt: string } | null;
  }>;
  recentCheckIns: Array<{
    id: string;
    checkedAt: string;
    user: { employeeId: string; name: string };
    booking: { schedule: { departAt: string; route: { name: string } } };
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        setStats(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ภาพรวมวันนี้</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="จองวันนี้"
          value={stats?.totalBookingsToday ?? 0}
          color="blue"
          icon="📋"
        />
        <StatCard
          label="เช็คอินแล้ว"
          value={stats?.checkedInToday ?? 0}
          color="green"
          icon="✅"
        />
        <StatCard
          label="รอเช็คอิน"
          value={stats?.pendingCheckin ?? 0}
          color="amber"
          icon="⏳"
        />
        <StatCard
          label="เส้นทางที่ใช้งาน"
          value={stats?.activeRoutes ?? 0}
          color="purple"
          icon="🚌"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">เช็คอินล่าสุด</h2>
            <button
              onClick={() => router.push('/admin/checkins')}
              className="text-xs text-pcg-blue font-medium"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {!stats?.recentCheckIns?.length ? (
              <p className="text-center text-gray-400 py-8 text-sm">ยังไม่มีการเช็คอิน</p>
            ) : (
              stats.recentCheckIns.map((ci) => (
                <div key={ci.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{ci.user.name}</p>
                    <p className="text-xs text-gray-400">{ci.user.employeeId} • {ci.booking.schedule.route.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-600">{formatTime(new Date(ci.checkedAt))} น.</p>
                    <p className="text-xs text-gray-400">{ci.booking.schedule.departAt}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">การจองล่าสุด</h2>
            <button
              onClick={() => router.push('/admin/bookings')}
              className="text-xs text-pcg-blue font-medium"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {!stats?.recentBookings?.length ? (
              <p className="text-center text-gray-400 py-8 text-sm">ยังไม่มีการจอง</p>
            ) : (
              stats.recentBookings.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-pcg-blue font-bold text-xs">{b.schedule.departAt}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{b.user.name}</p>
                    <p className="text-xs text-gray-400">{b.user.employeeId} • {b.schedule.route.name}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {b.checkIn ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">เช็คอินแล้ว</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">รอเช็คอิน</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'amber' | 'purple';
  icon: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  const textColors = {
    blue: 'text-pcg-blue',
    green: 'text-green-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-3 text-lg`}>
        {icon}
      </div>
      <p className={`text-3xl font-black ${textColors[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

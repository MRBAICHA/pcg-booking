'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDateThai } from '@/lib/utils';
import PcgLogo from '@/components/PcgLogo';

interface ScheduleInfo {
  qrSvg: string;
  qrData: string;
  schedule: {
    id: string;
    date: string;
    departAt: string;
    route: {
      name: string;
      origin: string;
      destination: string;
    };
  };
}

export default function ScheduleQRPage() {
  const params = useParams();
  const router = useRouter();
  const [info, setInfo] = useState<ScheduleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/schedules/${params.id}/qr?format=json`);
        if (!res.ok) {
          setError('ไม่พบข้อมูล');
          return;
        }
        const data = await res.json();
        setInfo(data);
      } catch {
        setError('เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 text-lg">{error || 'ไม่พบข้อมูล'}</p>
        <button onClick={() => router.back()} className="text-pcg-blue font-medium">← กลับ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Screen view (non-print) */}
      <div className="print:hidden p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            กลับ
          </button>
          <h1 className="text-xl font-bold text-slate-800">QR Code สำหรับรถ</h1>
          <button
            onClick={() => window.print()}
            className="ml-auto bg-pcg-blue text-white px-5 py-2 rounded-xl font-medium text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            พิมพ์ QR Code
          </button>
        </div>
      </div>

      {/* Printable QR Card */}
      <div className="flex items-center justify-center p-8 print:p-0 print:block">
        <div
          id="qr-card"
          className="bg-white border-4 border-pcg-blue rounded-3xl print:rounded-none print:border-0 p-8 max-w-sm w-full text-center shadow-2xl print:shadow-none"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="mx-auto mb-3 w-24">
              <PcgLogo className="w-full h-auto" />
            </div>
            <p className="text-pcg-blue font-black text-lg">รถรับส่งพนักงาน</p>
            <p className="text-gray-500 text-xs">Perfect Companion Group</p>
          </div>

          {/* Route Info */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <p className="text-pcg-blue text-4xl font-black">{info.schedule.departAt}</p>
            <p className="text-gray-500 text-xs mt-0.5">เวลาออกรถ</p>
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-slate-800 font-bold text-sm">{info.schedule.route.name}</p>
              <p className="text-gray-500 text-xs mt-1">
                {info.schedule.route.origin}
                <span className="mx-1">→</span>
                {info.schedule.route.destination}
              </p>
              <p className="text-gray-400 text-xs mt-1">{formatDateThai(info.schedule.date)}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-6">
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: info.qrSvg }}
            />
          </div>

          {/* Instructions */}
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-green-700 font-semibold text-sm">📱 วิธีเช็คอิน</p>
            <p className="text-green-600 text-xs mt-1">
              เปิดแอป PCG → กด "เช็คอิน" → กด "สแกน QR ขึ้นรถ" → เล็งกล้องที่ QR นี้
            </p>
          </div>

          <p className="text-gray-300 text-xs mt-4">{info.qrData}</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A5; margin: 1cm; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

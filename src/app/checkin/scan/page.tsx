'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';
type GpsStatus = 'waiting' | 'ok' | 'denied';

interface CheckInResult {
  routeName: string;
  departAt: string;
  checkedAt: string;
  hasGPS: boolean;
}

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('waiting');
  const [isSecureContext, setIsSecureContext] = useState<boolean | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);
  const gpsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setIsSecureContext(window.isSecureContext);

    // Start watching GPS immediately on page load so it's ready when QR is scanned
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        gpsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGpsStatus('ok');
      },
      () => {
        if (!gpsRef.current) setGpsStatus('denied');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Start live camera scanner (HTTPS only)
  useEffect(() => {
    if (!useCamera || !isSecureContext) return;

    let html5Scanner: any = null;
    setState('scanning');

    async function startScanner() {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        html5Scanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 15, qrbox: { width: 260, height: 260 }, showTorchButtonIfSupported: true },
          false
        );
        html5Scanner.render(
          (text: string) => {
            html5Scanner.clear().catch(() => {});
            processQRText(text);
          },
          () => {}
        );
        scannerRef.current = html5Scanner;
      } catch {
        setErrorMsg('ไม่สามารถเปิดกล้องได้');
        setState('error');
      }
    }

    startScanner();
    return () => { scannerRef.current?.clear().catch(() => {}); };
  }, [useCamera, isSecureContext]);

  // Decode QR from image file (works on HTTP)
  async function handleImageCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('processing');

    try {
      // Draw image to canvas and extract pixel data
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = async () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) {
          setErrorMsg('ไม่พบ QR Code ในรูป กรุณาถ่ายให้ชัดขึ้นและเล็งตรงๆ ที่ QR');
          setState('error');
          return;
        }

        processQRText(code.data);
      };

      img.onerror = () => {
        setErrorMsg('ไม่สามารถอ่านรูปได้');
        setState('error');
      };

      img.src = url;
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการอ่าน QR');
      setState('error');
    }
  }

  function processQRText(text: string) {
    if (!text.startsWith('PCG-CHECKIN:')) {
      setErrorMsg('QR Code ไม่ถูกต้อง — กรุณาสแกนเฉพาะ QR Code ของรถ PCG');
      setState('error');
      return;
    }
    const scheduleId = text.replace('PCG-CHECKIN:', '').trim();
    doCheckin(scheduleId);
  }

  async function doCheckin(scheduleId: string) {
    setState('processing');

    // Use GPS already captured by watchPosition (ready instantly)
    const gps = gpsRef.current;
    const latitude = gps?.latitude;
    const longitude = gps?.longitude;

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, latitude, longitude, method: 'QR_SCAN' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาด');
        setState('error');
        return;
      }

      const ci = data.checkIn;
      setResult({
        routeName: ci.booking.schedule.route.name,
        departAt: ci.booking.schedule.departAt,
        checkedAt: new Date(ci.checkedAt).toLocaleTimeString('th-TH', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
        hasGPS: !!(latitude && longitude),
      });
      gpsRef.current = null;
      setState('success');
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
      setState('error');
    }
  }

  function retry() {
    setState('idle');
    setErrorMsg('');
    setResult(null);
    setUseCamera(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Loading state
  if (isSecureContext === null) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <MobileHeader title="สแกน QR ขึ้นรถ" subtitle="เล็งกล้องไปที่ QR Code บนรถ" />

      <div className="px-4 py-4">

        {/* IDLE: Choose method */}
        {state === 'idle' && (
          <div className="space-y-4">
            {/* GPS status indicator */}
            <div className={`rounded-2xl p-3 flex items-center gap-3 ${
              gpsStatus === 'ok'
                ? 'bg-green-900/40 border border-green-700/50'
                : gpsStatus === 'denied'
                ? 'bg-red-900/30 border border-red-700/40'
                : 'bg-blue-900/40 border border-blue-700/50'
            }`}>
              {gpsStatus === 'ok' && <><span className="text-xl flex-shrink-0">📍</span><p className="text-green-300 text-sm font-medium">GPS พร้อมแล้ว — ตำแหน่งจะถูกบันทึกอัตโนมัติ</p></>}
              {gpsStatus === 'denied' && <><span className="text-xl flex-shrink-0">⚠️</span><p className="text-red-300 text-sm">GPS ถูกปิด — ยังเช็คอินได้ แต่ไม่มีตำแหน่ง</p></>}
              {gpsStatus === 'waiting' && (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-blue-300 text-sm">กำลังรับสัญญาณ GPS... (กรุณา Allow ตำแหน่ง)</p>
                </>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageCapture}
            />

            {/* Photo capture button (works on HTTP + HTTPS) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-5
                         shadow-lg shadow-green-500/20 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl">
                  📷
                </div>
                <div className="text-left flex-1">
                  <p className="text-white text-lg font-black">ถ่ายรูป QR</p>
                  <p className="text-green-100 text-sm mt-0.5">เปิดกล้อง → ถ่ายรูป QR บนรถ</p>
                  <span className="inline-block mt-1.5 bg-green-700/50 text-green-200 text-xs px-2 py-0.5 rounded-full">
                    ✓ ใช้ได้ทุก network
                  </span>
                </div>
                <svg className="w-6 h-6 text-green-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>

            {/* Live camera (HTTPS only) */}
            {isSecureContext ? (
              <button
                onClick={() => setUseCamera(true)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl p-4
                           active:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pcg-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                    🔴
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-semibold">สแกน Live (ต่อเนื่อง)</p>
                    <p className="text-gray-400 text-xs mt-0.5">เล็งกล้องค้างไว้ สแกนอัตโนมัติ</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4">
                <div className="flex gap-3">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-amber-300 text-sm font-semibold">Live scan ต้องใช้ HTTPS</p>
                    <p className="text-amber-400/80 text-xs mt-0.5">
                      ใช้ปุ่ม "ถ่ายรูป QR" ด้านบนแทนได้เลย หรือเข้าผ่าน HTTPS ในการใช้งานจริง
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => router.back()}
              className="w-full text-gray-400 text-sm py-2"
            >
              ← กลับ
            </button>
          </div>
        )}

        {/* SCANNING: Live camera mode */}
        {state === 'scanning' && useCamera && (
          <>
            <div className="rounded-2xl overflow-hidden bg-black mb-4">
              <div id="qr-reader" className="w-full" />
            </div>
            <button onClick={retry} className="w-full text-gray-400 text-sm py-2">← ยกเลิก</button>
            <style>{`
              #qr-reader { border: none !important; }
              #qr-reader__dashboard { background: #1f2937 !important; padding: 12px !important; border-radius: 0 0 16px 16px; }
              #qr-reader__dashboard_section_csr button {
                background: #1e3a8a !important; color: white !important;
                border: none !important; padding: 8px 16px !important;
                border-radius: 8px !important; font-size: 14px !important;
              }
              #qr-reader__dashboard_section_swaplink { color: #93c5fd !important; }
              #qr-reader__status_span { color: #d1d5db !important; font-size: 12px !important; }
              #qr-reader select { background: #374151 !important; color: white !important; border: 1px solid #4b5563 !important; border-radius: 8px !important; }
            `}</style>
          </>
        )}

        {/* PROCESSING */}
        {state === 'processing' && (
          <div className="min-h-[65vh] flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 bg-blue-900/50 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-bold">กำลังบันทึก...</p>
              <p className="text-gray-400 text-sm mt-1">
                {gpsStatus === 'ok' ? '📍 บันทึก GPS แล้ว' : '⏳ กำลังส่งข้อมูล...'}
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {state === 'success' && result && (
          <div className="min-h-[65vh] flex flex-col items-center justify-center gap-6 px-2">
            <div className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-green-400 text-2xl font-black">เช็คอินสำเร็จ!</p>
              <p className="text-gray-400 text-sm mt-1">ระบบบันทึกการขึ้นรถเรียบร้อย</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5 w-full text-center border border-gray-700">
              <p className="text-white font-bold">{result.routeName}</p>
              <p className="text-blue-400 text-4xl font-black mt-2">{result.departAt} น.</p>
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-1">
                <p className="text-gray-400 text-xs">เวลาเช็คอิน</p>
                <p className="text-white font-semibold">{result.checkedAt} น.</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">📷 QR Scan</span>
                  {result.hasGPS && (
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full">📍 บันทึก GPS</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl text-base active:bg-green-600"
            >
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="min-h-[65vh] flex flex-col items-center justify-center gap-6 px-2">
            <div className="w-28 h-28 bg-red-900/40 border-2 border-red-500 rounded-full flex items-center justify-center">
              <svg className="w-14 h-14 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-red-400 text-xl font-bold">เช็คอินไม่สำเร็จ</p>
              <p className="text-gray-300 text-sm mt-2 max-w-xs leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={retry} className="flex-1 bg-pcg-blue text-white font-bold py-3.5 rounded-2xl text-base">
                ลองใหม่
              </button>
              <button onClick={() => router.push('/checkin')} className="flex-1 bg-gray-700 text-white font-bold py-3.5 rounded-2xl text-base">
                กลับ
              </button>
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}

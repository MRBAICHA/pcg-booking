'use client';

import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  showLogout?: boolean;
}

export default function MobileHeader({ title, subtitle, userName, showLogout }: MobileHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="bg-pcg-blue text-white safe-top">
      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-blue-200 text-xs mt-0.5">{subtitle}</p>}
          {userName && <p className="text-blue-100 text-sm mt-0.5">สวัสดี, {userName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 flex items-center justify-center">
            <img src="/logo.svg" alt="PCG" className="h-full w-auto" />
          </div>
          {showLogout && (
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center text-blue-200 active:text-white"
              title="ออกจากระบบ"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

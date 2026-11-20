import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { AppTab } from '../types';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userName: string;
  userPhotoUrl?: string;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'kurikulum', label: 'Kurikulum' },
  { id: 'awam', label: 'Bahasa Awam' },
  { id: 'minigame', label: 'Mini-Game' },
  { id: 'asesmen', label: 'Asesmen' },
  { id: 'rekap', label: 'Rekap & Hasil' },
  { id: 'peringkat', label: 'Peringkat' },
];

export function TopNav({ activeTab, onSelectTab, userName, userPhotoUrl }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (tab: AppTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('kurikulum')}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
        >
          PyDasar Studio
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded ${
                  isActive
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-700 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('profil')}
            aria-label={`Buka profil ${userName}`}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              activeTab === 'profil'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {userPhotoUrl && (
              <img
                src={userPhotoUrl}
                alt=""
                aria-hidden="true"
                className="w-5 h-5 rounded-full object-cover border border-white/30"
              />
            )}
            Profil
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Navigasi seluler"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}

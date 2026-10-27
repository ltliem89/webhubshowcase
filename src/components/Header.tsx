import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Language } from '../types';
import { SentinelMetrics } from '../services/webhubSentinel';
import { translations } from '../translations';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isAdmin: boolean;
  onOpenAdmin: ({lastSyncedAt}) => void;
  onOpenSubmit: ({lastSyncedAt}) => void;
  pendingCount: number;
  isCloudSyncing?: boolean;
  isOnline?: boolean;
  onRefreshSync?: () => void;
  lastSyncedAt?: string;
  sentinelMetrics?: SentinelMetrics | null;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'my', name: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'lo', name: 'ລາວ', flag: '🇱🇦' },
  { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'tet', name: 'Tetun', flag: '🇹🇱' },
];

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  searchQuery,
  onSearchChange,
  isAdmin,
  onOpenAdmin,
  onOpenSubmit,
  pendingCount,
  isCloudSyncing = false,
  isOnline: propIsOnline,
  onRefreshSync,
  lastSyncedAt,
  sentinelMetrics,
}) => {
  const t = translations[lang];
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Theo dõi trạng thái online/offline của thiết bị và trình duyệt
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trực tuyến khi cả thiết bị online và không có lỗi từ Supabase/Sentinel
  const effectiveOnline =
    (propIsOnline !== undefined ? propIsOnline : browserOnline) &&
    sentinelMetrics?.status !== 'error';

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5.5rem] py-2 sm:py-2.5 gap-3 sm:gap-6">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-2xl bg-white p-1 shadow-md shadow-indigo-500/15 border border-slate-200/90 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                {t.appName}
              </span>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Supabase Cloud Status Indicator: Dấu xanh khi online, đỏ khi off */}
            <button
              id="header-supabase-sync-btn"
              onClick={onRefreshSync}
              disabled={isCloudSyncing}
              title={
                isCloudSyncing
                  ? 'Đang kết nối và rà soát dữ liệu với Supabase & Vercel...'
                  : sentinelMetrics
                  ? `[WebHub Sentinel Tình Báo Thông Minh]\n• Trạng thái: ${effectiveOnline ? 'Trực tuyến (Online)' : 'Ngoại tuyến (Offline)'}\n• Đã kiểm tra: ${sentinelMetrics.totalChecks} lần (${sentinelMetrics.notModified304Count} lần 304 Not Modified)\n• Tiết kiệm băng thông: ~${sentinelMetrics.bandwidthSavedKB} KB\n• Kiểm tra gần nhất: ${sentinelMetrics.lastCheckedAt || lastSyncedAt}\nNhấp để rà soát phiên bản ngay tức thì!`
                  : effectiveOnline
                  ? (lastSyncedAt
                    ? `Trực tuyến (Online): Đã rà soát & cập nhật lúc ${lastSyncedAt}. Bấm để rà soát lại.`
                    : 'Trực tuyến (Online): Supabase đã kết nối. Bấm để rà soát dữ liệu.')
                  : 'Ngoại tuyến (Offline): Mất kết nối mạng hoặc Supabase. Bấm để thử lại.'
              }
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-xl border select-none transition-all cursor-pointer shrink-0 ${
                isCloudSyncing
                  ? 'bg-indigo-50/90 border-indigo-300 text-indigo-700 animate-pulse'
                  : effectiveOnline
                  ? 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-200/80 text-emerald-800 hover:shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100/90 border-rose-200/80 text-rose-700 hover:shadow-xs'
              }`}
              aria-label={effectiveOnline ? 'Supabase Online' : 'Supabase Offline'}
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              ) : effectiveOnline ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                </span>
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
                </span>
              )}
            </button>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                id="language-selector-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                title={t.selectLanguage}
              >
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-fade-in">
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          onLanguageChange(item.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                          lang === item.code
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span>{item.flag}</span>
                          <span>{item.name}</span>
                        </span>
                        {lang === item.code && <span className="text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/*
              Supabase Cloud database synchronization active.
            */}

            {/* Admin Portal Toggle */}
            <button
              id="header-admin-btn"
              onClick={onOpenAdmin}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isAdmin
                  ? 'bg-amber-500/10 border-amber-400/80 text-amber-800 hover:bg-amber-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden sm:inline">{isAdmin ? t.adminMode : t.adminPortal}</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-100/90 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

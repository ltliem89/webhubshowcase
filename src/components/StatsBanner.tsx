import React from 'react';
import { Eye, Globe, Plus, Users } from 'lucide-react';
import { Language, WebProject } from '../types';
import { translations } from '../translations';

interface StatsBannerProps {
  projects: WebProject[];
  lang: Language;
  onOpenSubmit: () => void;
  siteVisits?: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  projects,
  lang,
  onOpenSubmit,
  siteVisits = 0,
}) => {
  const t = translations[lang];
  const approvedProjects = projects.filter((p) => p.status === 'approved');
  const totalViews = approvedProjects.reduce((acc, p) => acc + p.views, 0);
  const formattedViews = totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews;
  const formattedSiteVisits = siteVisits > 1000 ? `${(siteVisits / 1000).toFixed(1)}k` : siteVisits;

  return (
    <div
      id="hero-compact-banner"
      className="flex items-center justify-between py-2 px-3 sm:py-2.5 sm:px-5 mb-4 sm:mb-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm gap-2"
    >
      {/* Short clean title + site visits count */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="font-extrabold text-xs sm:text-base tracking-wide text-white">
            {t.appName}
          </span>
        </div>

        {/* Visitor counter badge */}
        <div
          className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] sm:text-xs font-medium"
          title="Tổng số lượt truy cập trang web (được lưu trữ trên Supabase)"
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-slate-400">Lượt truy cập:</span>
          <span className="font-bold text-emerald-300 font-mono">
            {formattedSiteVisits || 1}
          </span>
        </div>
      </div>

      {/* Action: "Đăng tải website" with small view count badge */}
      <button
        id="hero-share-website-btn"
        onClick={onOpenSubmit}
        className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 sm:space-x-2 shrink-0 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">{t.submitWebsite}</span>
        <span
          className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-200 text-[10px] sm:text-[11px] font-mono font-medium border border-indigo-400/30 flex items-center space-x-1 shrink-0"
          title={t.viewsCount.replace('{count}', String(formattedViews))}
        >
          <Eye className="w-3 h-3 text-indigo-300" />
          <span>{formattedViews}</span>
        </span>
      </button>
    </div>
  );
};

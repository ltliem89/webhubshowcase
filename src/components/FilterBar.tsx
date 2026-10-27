import React from 'react';
import {
  AlignLeft,
  Box,
  CheckCircle2,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  CategoryId,
  EducationLevelId,
  FilterState,
  Language,
  VN_SUBJECTS,
  ViewMode,
} from '../types';
import { translations } from '../translations';
import { RocketFlying } from './RocketFlying';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  lang: Language;
  totalResults: number;
  approvedCount: number;
  famousCount: number;
  onOpenSubmit?: () => void;
  showGuide?: boolean;
  onOpenGuide?: () => void;
  onCloseGuide?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  lang,
  totalResults,
  approvedCount,
  famousCount,
  onOpenSubmit,
  showGuide,
  onOpenGuide,
  onCloseGuide,
}) => {
  const t = translations[lang];

  const handleCategoryChange = (category: CategoryId | 'ALL') => {
    onFilterChange({ ...filters, category });
  };

  const handleOpenGuideTab = () => {
    onFilterChange({
      searchQuery: '',
      category: 'ALL',
      educationLevel: 'ALL',
      sortBy: 'newest',
      onlyFamous: false,
    });
    if (onOpenGuide) onOpenGuide();
  };

  const handleCloseGuideTab = () => {
    if (onCloseGuide) onCloseGuide();
  };

  const handleLevelChange = (educationLevel: EducationLevelId | 'ALL') => {
    onFilterChange({ ...filters, educationLevel });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFilterChange({ ...filters, sortBy });
  };

  const handle3DChange = (only3D: boolean) => {
    onFilterChange({ ...filters, only3D });
  };

  const toggleFamousFilter = (isFamous: boolean) => {
    onFilterChange({ ...filters, onlyFamous: isFamous });
    if (onCloseGuide) onCloseGuide();
  };

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'ALL',
      educationLevel: 'ALL',
      sortBy: 'newest',
      onlyFamous: false,
      only3D: false,
    });
  };

  const isFiltered =
    filters.category !== 'ALL' ||
    filters.educationLevel !== 'ALL' ||
    filters.searchQuery !== '' ||
    !!filters.only3D;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-4 shadow-xs mb-5 space-y-2.5 sm:space-y-3">
      {/* 1. Thanh điều khiển chính: Các Tab [📤 Bài đăng] & [⭐ Nổi tiếng] & [🚀 Kiến tạo] cùng cụm Icon chế độ xem [☰ Rút gọn] [⊞ Mở rộng] trên CÙNG 1 HÀNG */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pb-2.5 border-b border-slate-100 flex-nowrap overflow-x-auto no-scrollbar">
        {/* Bên trái: 3 Tab phân biệt rõ ràng */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Tab 1: Bài đăng tải của giáo viên/học sinh/người dùng */}
          <button
            id="tab-user-submitted-btn"
            onClick={() => toggleFamousFilter(false)}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              !filters.onlyFamous && !showGuide
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-300/40'
                : 'bg-slate-100/90 text-slate-700 border-slate-200/80 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
            title={t.uploadTabTitle}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{t.uploadTab}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                !filters.onlyFamous && !showGuide
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          {/* Tab 2: Mô phỏng nổi tiếng quốc tế (PhET, GeoGebra, NetSim...) */}
          <button
            id="tab-famous-btn"
            onClick={() => toggleFamousFilter(true)}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              filters.onlyFamous && !showGuide
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20 ring-2 ring-amber-300/50'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
            }`}
            title={t.famousTabTitle}
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                filters.onlyFamous && !showGuide ? 'text-amber-100 fill-amber-100' : 'text-amber-600 fill-amber-500'
              }`}
            />
            <span className="whitespace-nowrap">{t.famousTabShort}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                filters.onlyFamous && !showGuide
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-200/90 text-amber-950'
              }`}
            >
              {famousCount}
            </span>
          </button>

          {/* Tab 3: Hướng dẫn tạo mô phỏng bằng AI */}
          <button
            id="tab-guide-btn"
            onClick={showGuide ? handleCloseGuideTab : handleOpenGuideTab}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
              showGuide
                ? 'bg-slate-900 text-white border-slate-950 shadow-sm shadow-slate-500/20 ring-2 ring-slate-400/40'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
            }`}
            title={t.guideTabTitle}
          >
            <RocketFlying
              className={`w-4 h-4 shrink-0 animate-rocket ${
                showGuide ? 'fill-indigo-400 text-indigo-300 drop-shadow-[0_0_6px_rgba(129,140,248,0.9)]' : 'text-indigo-500'
              }`}
            />
            <span className={`whitespace-nowrap ${
              showGuide ? 'text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]' : ''
            }`}>
              {t.guideTab}
            </span>
          </button>
        </div>

        {/*
          Bên phải: Cụm chế độ xem [☰ Rút gọn] [⊞ Mở rộng] - CÙNG HÀNG VỚI KIẾN TẠO
        */}
        <div className="flex items-center space-x-1 sm:space-x-2 ml-auto shrink-0">
          {/* Cụm chế độ xem: [☰ Rút gọn] & [⊞ Mở rộng] */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 p-0.5 sm:p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            {/* Rút gọn */}
            <button
              id="view-mode-compact-btn"
              onClick={() => onViewModeChange('compact')}
              className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t.viewModeCompact}
              aria-label={t.viewModeCompact}
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* Mở rộng */}
            <button
              id="view-mode-expanded-btn"
              onClick={() => onViewModeChange('expanded')}
              className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'expanded'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t.viewModeExpanded}
              aria-label={t.viewModeExpanded}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hàng bộ lọc: Môn học, Cấp học, Sắp xếp theo, Mô phỏng 3D - GỌN TRÊN 1 HÀNG CHO CẢ MOBILE & DESKTOP */}
      {!showGuide && (
      <div className="grid grid-cols-4 gap-1 sm:gap-2.5 items-end">
        {/* Môn học / Lĩnh vực (Category) */}
        <div className="min-w-0">
          <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1 truncate" title={t.categoryLabel}>
            <span className="hidden sm:inline">📁 {t.categoryLabel}</span>
            <span className="sm:hidden flex items-center gap-0.5">📁 {lang === 'vi' ? 'Lĩnh vực' : t.categoryLabel}</span>
          </label>
          <select
            id="filter-category-select"
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value as CategoryId | 'ALL')}
            className="w-full px-1 sm:px-2 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 text-[10px] sm:text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 transition-colors truncate cursor-pointer h-[34px]"
          >
            <option value="ALL">📁 {t.allCategories}</option>
            {VN_SUBJECTS.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {t.categoryNames[subj.id] ?? subj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cấp học phù hợp (Education Level) */}
        <div className="min-w-0">
          <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1 truncate" title={t.levelLabel}>
            <span className="hidden sm:inline">🎓 {t.levelLabel}</span>
            <span className="sm:hidden flex items-center gap-0.5">🎓 {lang === 'vi' ? 'Cấp học' : t.levelLabel}</span>
          </label>
          <select
            id="filter-level-select"
            value={filters.educationLevel}
            onChange={(e) => handleLevelChange(e.target.value as EducationLevelId | 'ALL')}
            className="w-full px-1 sm:px-2 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 text-[10px] sm:text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 transition-colors truncate cursor-pointer h-[34px]"
          >
            <option value="ALL">🎓 {t.allLevels}</option>
            {Object.entries(t.educationLevelNames).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Sắp xếp theo (Sort By) */}
        <div className="min-w-0">
          <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1 truncate" title={t.sortBy}>
            <span className="hidden sm:inline">🕒 {t.sortBy}</span>
            <span className="sm:hidden flex items-center gap-0.5">🕒 {lang === 'vi' ? 'Sắp xếp' : t.sortBy}</span>
          </label>
          <select
            id="filter-sort-select"
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
            className="w-full px-1 sm:px-2 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 text-[10px] sm:text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 transition-colors truncate cursor-pointer h-[34px]"
          >
            <option value="newest">🕒 {t.sortNewest}</option>
            <option value="most_liked">❤️ {t.sortMostLiked}</option>
            <option value="most_viewed">👁️ {t.sortMostViewed}</option>
            <option value="oldest">⏳ {t.sortOldest}</option>
          </select>
        </div>

        {/* Công tắc lọc 3D (Ngay sau Sắp xếp theo) */}
        <div className="min-w-0">
          <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1 truncate flex items-center justify-between" title={t.filter3DLabel || 'Mô phỏng 3D'}>
            <span className="hidden sm:inline">🧊 {t.filter3DLabel || 'Mô phỏng 3D'}</span>
            <span className="sm:hidden flex items-center gap-0.5">🧊 3D</span>
            {filters.only3D && (
              <span className="text-[8px] sm:text-[9px] font-black text-cyan-600 uppercase tracking-wider hidden xs:inline">ON</span>
            )}
          </label>
          <div className="flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200 h-[34px]">
            {/* Tùy chọn 1: Tất cả (Mặc định) */}
            <button
              id="filter-3d-all-btn"
              type="button"
              onClick={() => handle3DChange(false)}
              className={`flex-1 h-full rounded-lg text-[9px] sm:text-xs font-semibold transition-all cursor-pointer truncate px-0.5 sm:px-1.5 text-center select-none flex items-center justify-center ${
                !filters.only3D
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t.filter3DAll || 'Tất cả'}
            >
              <span className="truncate">{t.filter3DAll || 'Tất cả'}</span>
            </button>

            {/* Tùy chọn 2: 3D (Đổi màu khi chọn) */}
            <button
              id="filter-3d-only-btn"
              type="button"
              onClick={() => handle3DChange(true)}
              className={`flex-1 h-full rounded-lg text-[9px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 px-0.5 sm:px-1.5 text-center select-none ${
                filters.only3D
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md border border-cyan-300 ring-1 sm:ring-2 ring-cyan-400/30'
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
              title="Chỉ 3D"
            >
              <Box className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${filters.only3D ? 'text-cyan-200 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="truncate">{t.filter3DOnly || '3D'}</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Tóm tắt kết quả lọc & Nút Đặt lại bộ lọc */}
      {!showGuide && (isFiltered || totalResults === 0) && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            {filters.onlyFamous
              ? t.resultsFamousFound.replace('{count}', String(totalResults))
              : t.resultsApprovedFound.replace('{count}', String(totalResults))}
          </span>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.clearFilters}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

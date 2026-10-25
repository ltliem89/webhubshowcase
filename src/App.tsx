/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FilterState,
  Language,
  LANGUAGE_CODES,
  ViewMode,
  WebProject,
} from './types';
import { INITIAL_PROJECTS } from './data/initialData';
import { localizeProject } from './data/projectLocalizations';
import { translations } from './translations';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { incrementVisitorCount } from './services/visitorCounter';
import { FilterBar } from './components/FilterBar';
import { ProjectCard } from './components/ProjectCard';
import { TimelineLayerCard } from './components/TimelineLayerCard';
import { CompactListItem } from './components/CompactListItem';
import { SimulationGuide } from './components/SimulationGuide';
import { QRCodeModal } from './components/QRCodeModal';
import { SubmitModal } from './components/SubmitModal';
import { AdminModal } from './components/AdminModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Globe, Plus, Sparkles } from 'lucide-react';
import {
  ensureGoLink,
} from './utils/goLink';
import {
  fetchProjectsFromSupabase,
  fetchSubmissionsFromSupabase,
  submitToSupabase,
  upsertProjectToSupabase,
  approveSubmissionInSupabase,
  rejectSubmissionInSupabase,
  deleteProjectFromSupabase,
  incrementProjectStat,
  supabase,
} from './services/supabaseClient';
import {
  submitProjectToGoogleSheet,
  fetchSubmissionsFromGoogleSheet,
  updateProjectStatusOnGoogleSheet,
} from './services/sheetSubmission';
import {
  isCommunityApprovedOnly,
  setCommunityApprovedOnly,
} from './config';

const STORAGE_KEY_PROJECTS = 'webhub_projects_data_v13';
const STORAGE_KEY_LANG = 'webhub_language_preference';
const STORAGE_KEY_ADMIN = 'webhub_admin_session';

// Helper to ensure famous platforms and community submissions are cleanly separated
const sanitizeAndMigrateProjects = (loadedList: WebProject[]): WebProject[] => {
  // CĂ¡c dá»¯ liá»‡u máº«u cÅ© Ä‘Ă£ Ä‘Æ°á»£c gá»¡ khá»i báº£n khá»Ÿi táº¡o (demo bĂ i Ä‘Äƒng táº£i, pending, má»¥c ghĂ©p cÅ©)
  const deprecatedSampleIds = new Set<string>([
    'proj-phys-1',
    'proj-chem-1',
    'proj-math-1',
    'proj-bio-1',
    'proj-hist-1',
    'proj-lit-1',
    'proj-eng-1',
    'proj-pending-1',
  ]);

  const famousKeywords = [
    'phet',
    'geogebra',
    'netsim',
    'packet-tracer',
    'falstad',
    'desmos',
    'scratch',
    'biodigital',
    'algorithm-visualizer',
    'molview',
  ];

  const initialFamous = INITIAL_PROJECTS.filter((p) => p.isFamous);

  const updated: WebProject[] = loadedList
    .filter((p) => !deprecatedSampleIds.has(p.id))
    .map((p) => {
      const isFamousMatch = famousKeywords.some(
        (kw) =>
          p.url.toLowerCase().includes(kw) ||
          p.id.toLowerCase().includes(kw) ||
          p.title.toLowerCase().includes(kw)
      );
      const isFamousActual = isFamousMatch || !!p.isFamous;
      // Giá»¯ dá»¯ liá»‡u cÅ©: bĂ i approved khĂ´ng ná»•i tiáº¿ng â†’ coi lĂ  bĂ i admin Ä‘Ă£ duyá»‡t
      // (cĂ¡c bĂ i máº«u khá»Ÿi táº¡o Ä‘á»u lĂ  famous nĂªn khĂ´ng bá»‹ tĂ­nh nháº§m)
      const isUserSubmission =
        p.isUserSubmission === true ||
        (p.status === 'approved' && !isFamousActual);
      return {
        ...p,
        isFamous: isFamousActual,
        isUserSubmission,
      };
    });

  // Ensure all projects from INITIAL_PROJECTS (famous & community) are included
  for (const init of INITIAL_PROJECTS) {
    if (!updated.some((p) => p.id === init.id || p.url === init.url)) {
      updated.push(init);
    }
  }

  return updated;
};

// Há»£p nháº¥t dá»¯ liá»‡u cloud (bĂ i Ä‘Ă£ duyá»‡t) vá»›i báº£n local Ä‘á»ƒ KHĂ”NG lĂ m máº¥t cĂ¡c cá»
// Ä‘Ă£ biáº¿t nhÆ° isUserSubmission / isFamous, vĂ  KHĂ”NG lĂ m giáº£m Views/Likes.
// LĂ½ do: Apps Script cÅ© / dá»¯ liá»‡u cÅ© trong Sheets chÆ°a cĂ³ cá»™t IsUserSubmission
// nĂªn dá»¯ liá»‡u táº£i vá» thiáº¿u cá» -> náº¿u ghi Ä‘Ă¨ trá»±c tiáº¿p, bĂ i Ä‘Ă£ duyá»‡t vá»¥t máº¥t khá»i
// tab "BĂ i Ä‘Äƒng táº£i" (cá»™ng Ä‘á»“ng).
const mergeCloudProject = (
  local: WebProject,
  cloud: WebProject
): WebProject => ({
  ...cloud,
  views: Math.max(local.views, cloud.views),
  likes: Math.max(local.likes, cloud.likes),
  isFamous: local.isFamous === true || cloud.isFamous === true,
  isUserSubmission:
    local.isUserSubmission === true || cloud.isUserSubmission === true,
});

export default function App() {
  // 1. Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    // TrĂ¡nh giĂ¡ trá»‹ cÅ© (ja/fr) khĂ´ng cĂ²n Ä‘Æ°á»£c há»— trá»£ â†’ quay vá» tiáº¿ng Viá»‡t
    return LANGUAGE_CODES.includes(saved as Language) ? (saved as Language) : 'vi';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY_LANG, newLang);
  };

  const t = translations[lang];

  // 2. Admin Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
  });

  const handleSetIsAdmin = (val: boolean) => {
    setIsAdmin(val);
    localStorage.setItem(STORAGE_KEY_ADMIN, val ? 'true' : 'false');
  };

  // Biáº¿n kiá»ƒm soĂ¡t cháº¿ Ä‘á»™ cá»™ng Ä‘á»“ng: tab "BĂ i Ä‘Äƒng táº£i" chá»‰ hiá»ƒn thá»‹ bĂ i admin duyá»‡t
  const [communityOnly, setCommunityOnly] = useState<boolean>(() =>
    isCommunityApprovedOnly()
  );

  const handleCommunityOnlyChange = (val: boolean) => {
    setCommunityApprovedOnly(val);
    setCommunityOnly(val);
  };

  // 3. Projects State (Loaded from localStorage with clean migration across all versions or Initial Seed)
  const [projects, setProjects] = useState<WebProject[]>(() => {
    try {
      const storageKeys = [
        'webhub_projects_data_v5',
        'webhub_projects_data_v4',
        'webhub_projects_data_v3',
        'webhub_projects_data_v2',
        'webhub_projects_data_v1',
        'webhub_projects_data',
      ];
      const mergedList: WebProject[] = [];
      for (const key of storageKeys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (
                  item &&
                  item.id &&
                  !mergedList.some(
                    (existing) => existing.id === item.id || existing.url === item.url
                  )
                ) {
                  // Giá»¯ nguyĂªn tráº¡ng thĂ¡i (approved / pending / rejected) khi táº£i láº¡i
                  mergedList.push({ ...item });
                }
              }
            }
          } catch {
            // ignore JSON error
          }
        }
      }

      if (mergedList.length > 0) {
        return sanitizeAndMigrateProjects(mergedList);
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROJECTS;
  });

  // Save projects to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [projects]);

  // Trạng thái đồng bộ Supabase Cloud
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // 4. View Mode & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('expanded');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'ALL',
    educationLevel: 'ALL',
    sortBy: 'newest',
    onlyFamous: false,
  });
  // Tab "Hướng dẫn tạo mô phỏng" — khi bật, ẩn danh sách web và hiện hướng dẫn
  const [showGuide, setShowGuide] = useState(false);

  const handleOpenGuide = () => setShowGuide(true);
  const handleExitGuide = () => setShowGuide(false);

  // 5. Modals State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<WebProject | null>(null);

  const handleOpenEditProject = (p: WebProject) => {
    const raw = projects.find((item) => item.id === p.id) || p;
    setEditingProject(raw);
    setIsSubmitOpen(true);
  };

  const handleOpenSubmitNew = () => {
    setEditingProject(null);
    setIsSubmitOpen(true);
  };
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedQRProject, setSelectedQRProject] = useState<WebProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<WebProject | null>(null);
  const [siteVisits, setSiteVisits] = useState<number>(1);

  useEffect(() => {
    incrementVisitorCount()
      .then((v) => {
        if (v) setSiteVisits(v);
      })
      .catch(() => {});
  }, []);

  /**
   * Đồng bộ dữ liệu 2 chiều với Supabase Cloud Database & bảng đợi Google Sheet:
   * mezcsiaozymspbroflye.supabase.co
   */
  const syncFromSupabase = useCallback(async () => {
    try {
      setIsCloudSyncing(true);
      const [cloudProjects, cloudSubs, sheetSubs] = await Promise.all([
        fetchProjectsFromSupabase(),
        fetchSubmissionsFromSupabase(),
        fetchSubmissionsFromGoogleSheet(),
      ]);

      if (cloudProjects && cloudProjects.length > 0) {
        setProjects((prev) => {
          const map = new Map<string, WebProject>();
          for (const p of prev) {
            if (p.status === 'pending' || p.status === 'rejected') {
              map.set(p.id, p);
            }
          }
          for (const cp of cloudProjects) {
            map.set(cp.id, cp);
          }
          for (const cs of cloudSubs) {
            if (!map.has(cs.id)) {
              map.set(cs.id, cs);
            }
          }
          for (const ss of sheetSubs) {
            if (!map.has(ss.id)) {
              map.set(ss.id, ss);
            }
          }
          const finalMerged = sanitizeAndMigrateProjects(Array.from(map.values()));
          try {
            localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(finalMerged));
          } catch {}
          return finalMerged;
        });
      }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // Tải dữ liệu từ Supabase khi mở app & lắng nghe Realtime trên bảng webhub
  useEffect(() => {
    syncFromSupabase();

    const channel = supabase
      .channel('public:webhub-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'webhub' },
        () => {
          syncFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncFromSupabase]);

  // 6. Action Handlers (Supabase Powered)
  const handleLike = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const nextVal = p.likes + 1;
          incrementProjectStat(projectId, 'likes', p.likes);
          return { ...p, likes: nextVal };
        }
        return p;
      })
    );
  };

  const handleVisit = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const nextVal = p.views + 1;
          incrementProjectStat(projectId, 'views', p.views);
          return { ...p, views: nextVal };
        }
        return p;
      })
    );
  };

  const handleSubmitNewProject = (
    data: Omit<WebProject, 'id' | 'createdAt' | 'views' | 'likes'>
  ) => {
    const id = `proj-${Date.now()}`;
    const thumbnail = (data.previewImage && data.previewImage.trim()) || undefined;

    const newProject: WebProject = {
      ...data,
      id,
      status: 'pending',
      isUserSubmission: true,
      createdAt: new Date().toISOString(),
      views: 1,
      likes: 0,
      previewImage: thumbnail,
      goLink: '',
    };
    const newProjectWithGoLink = ensureGoLink(newProject);
    setProjects((prev) => [newProjectWithGoLink, ...prev]);
    setFilters((prev) => ({ ...prev, onlyFamous: false }));

    // 1. Gửi thẳng vào bảng đợi Google Sheet (WebHub_Submissions)
    submitProjectToGoogleSheet(newProjectWithGoLink);

    // 2. Gửi lưu trữ bản sao lên Supabase submissions
    submitToSupabase(newProjectWithGoLink);
  };

  const handleApprove = (id: string) => {
    const project = projects.find((p) => p.id === id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved', isUserSubmission: true } : p))
    );

    if (project) {
      const approvedProj: WebProject = {
        ...project,
        status: 'approved',
        isUserSubmission: true,
      };
      // Lưu vào Supabase bảng webhub chính thức
      approveSubmissionInSupabase(approvedProj);
      // Cập nhật trạng thái duyệt bài sang Google Sheet
      updateProjectStatusOnGoogleSheet(id, 'approved');
    }
  };

  const handleReject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    );
    rejectSubmissionInSupabase(id);
    updateProjectStatusOnGoogleSheet(id, 'rejected');
  };

  const handleConfirmDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    deleteProjectFromSupabase(id);
  };

  const handleUpdateProject = (updated: WebProject) => {
    const existing = projects.find((p) => p.id === updated.id);
    const merged: WebProject = existing
      ? {
          ...updated,
          id: existing.id,
          createdAt: existing.createdAt || updated.createdAt,
          status: existing.status || updated.status,
          views: Math.max(existing.views, updated.views),
          likes: Math.max(existing.likes, updated.likes),
          isFamous: existing.isFamous === true ? true : updated.isFamous === true,
          isUserSubmission:
            existing.isUserSubmission === true
              ? true
              : updated.isUserSubmission === true,
        }
      : updated;

    setProjects((prev) =>
      prev.map((p) => (p.id === merged.id ? merged : p))
    );

    upsertProjectToSupabase(merged);
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhub-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (imported: WebProject[]) => {
    setProjects(imported);
    alert(t.amImportSuccess.replace('{count}', String(imported.length)));
  };

  const handleResetData = () => {
    if (window.confirm(t.amResetConfirm)) {
      setProjects(INITIAL_PROJECTS);
      localStorage.removeItem(STORAGE_KEY_PROJECTS);
    }
  };

  // 7. Filtering & Sorting Logic
  const approvedProjects = useMemo(
    () => projects.filter((p) => p.status === 'approved'),
    [projects]
  );
  const localizedProjects = useMemo(
    () => approvedProjects.map((p) => localizeProject(p, lang)),
    [approvedProjects, lang]
  );
  const defaultApprovedCount = useMemo(
    () =>
      approvedProjects.filter(
        (p) => !p.isFamous && (communityOnly ? p.isUserSubmission : true)
      ).length,
    [approvedProjects, communityOnly]
  );
  const famousCount = useMemo(
    () => approvedProjects.filter((p) => !!p.isFamous).length,
    [approvedProjects]
  );

  const filteredProjects = useMemo(() => {
    return localizedProjects
      .filter((project) => {
        // Náº¿u ngÆ°á»i dĂ¹ng báº­t nĂºt "Ná»•i tiáº¿ng": hiá»ƒn thá»‹ cĂ¡c mĂ´ phá»ng ná»•i tiáº¿ng (PhET, GeoGebra, NetSim...)
        // Máº·c Ä‘á»‹nh: hiá»ƒn thá»‹ cĂ¡c bĂ i do admin duyá»‡t (tab "BĂ i Ä‘Äƒng táº£i" - cháº¿ Ä‘á»™ cá»™ng Ä‘á»“ng)
        if (filters.onlyFamous) {
          if (!project.isFamous) return false;
        } else {
          if (project.isFamous) return false;
          // BIáº¾N KIá»‚M SOĂT Cá»˜NG Äá»’NG: náº¿u báº­t, chá»‰ hiá»‡n bĂ i ngÆ°á»i dĂ¹ng Ä‘Äƒng Ä‘Ă£ duyá»‡t,
          // má»i bĂ i máº«u (khĂ´ng pháº£i ná»•i tiáº¿ng) Ä‘á»u bá»‹ áº©n khá»i tab "BĂ i Ä‘Äƒng táº£i".
          if (communityOnly && !project.isUserSubmission) return false;
        }

        // Category / Subject filter
        if (filters.category !== 'ALL') {
          const cat = filters.category;
          const subjectAliases: Record<string, string[]> = {
            toan: ['toan', 'math'],
            vat_ly: ['vat_ly', 'physics', 'stem'],
            hoa_hoc: ['hoa_hoc', 'chemistry'],
            sinh_hoc: ['sinh_hoc', 'biology', 'health_medicine'],
            tin_hoc: ['tin_hoc', 'informatics', 'computer_science'],
            ngu_van: ['ngu_van', 'literature'],
            tieng_anh: ['tieng_anh', 'english', 'languages'],
            lich_su: ['lich_su', 'history', 'history_society'],
            dia_li: ['dia_li', 'geography'],
            khtn_stem: ['khtn_stem', 'stem', 'natural_sciences'],
            cong_nghe: ['cong_nghe', 'tools_utilities'],
            khac: ['khac', 'general', 'arts_design'],
          };
          const matches = (subjectAliases[cat] || [cat]).includes(project.category);
          if (!matches) return false;
        }

        // Education Level filter
        if (
          filters.educationLevel !== 'ALL' &&
          project.educationLevel !== filters.educationLevel
        ) {
          return false;
        }

        // Search Query
        if (filters.searchQuery.trim() !== '') {
          const query = filters.searchQuery.toLowerCase();
          const matchTitle = project.title.toLowerCase().includes(query);
          const matchDesc = project.description.toLowerCase().includes(query);
          const matchAuthor = project.authorName.toLowerCase().includes(query);
          const matchUrl = project.url.toLowerCase().includes(query);
          const matchTags = project.tags.some((tag) =>
            tag.toLowerCase().includes(query)
          );
          if (!matchTitle && !matchDesc && !matchAuthor && !matchUrl && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (filters.sortBy === 'most_liked') {
          return b.likes - a.likes;
        }
        if (filters.sortBy === 'most_viewed') {
          return b.views - a.views;
        }
        return 0;
      });
  }, [localizedProjects, filters, communityOnly]);

  const pendingCount = projects.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        lang={lang}
        onLanguageChange={handleLanguageChange}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => setFilters({ ...filters, searchQuery: query })}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSubmit={handleOpenSubmitNew}
        pendingCount={pendingCount}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Streamlined Banner Hero */}
        <StatsBanner
          projects={projects}
          lang={lang}
          onOpenSubmit={handleOpenSubmitNew}
          siteVisits={siteVisits}
        />

        {/* Filter and View Mode Switcher */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          lang={lang}
          totalResults={filteredProjects.length}
          approvedCount={defaultApprovedCount}
          famousCount={famousCount}
          onOpenSubmit={handleOpenSubmitNew}
          showGuide={showGuide}
          onOpenGuide={handleOpenGuide}
          onCloseGuide={handleExitGuide}
        />

        {/* Tab "Hướng dẫn tạo mô phỏng" */}
        {showGuide ? (
          <SimulationGuide
            lang={lang}
            onSubmit={() => {
              handleExitGuide();
              handleOpenSubmitNew();
            }}
          />
        ) : (
          /* Empty State */
          <>
          {filteredProjects.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.noWebsitesFound}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {t.emptyStateHint}
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() =>
                  setFilters({
                    searchQuery: '',
                    category: 'ALL',
                    educationLevel: 'ALL',
                    sortBy: 'newest',
                    onlyFamous: false,
                  })
                }
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t.clearFilters}
              </button>
              <button
                onClick={handleOpenSubmitNew}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs"
              >
                {t.submitWebsite}
              </button>
            </div>
          </div>
        ) : (
          /* Render based on View Mode: Expanded (Äáº§y Ä‘á»§ mockup, QR, mĂ´ táº£) vs Compact (Chá»‰ TĂªn & LÄ©nh vá»±c) */
          <>
            {viewMode === 'expanded' ? (
              <div
                id="projects-expanded-view"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    lang={lang}
                    isAdmin={isAdmin}
                    onOpenQR={(p) => setSelectedQRProject(p)}
                    onEditProject={handleOpenEditProject}
                    onDeleteRequest={(p) => setProjectToDelete(p)}
                    onLike={handleLike}
                    onVisit={handleVisit}
                  />
                ))}
              </div>
            ) : (
              <div id="projects-compact-view" className="space-y-2 max-w-4xl mx-auto">
                {filteredProjects.map((project) => (
                  <CompactListItem
                    key={project.id}
                    project={project}
                    lang={lang}
                    isAdmin={isAdmin}
                    onOpenQR={(p) => setSelectedQRProject(p)}
                    onEditProject={handleOpenEditProject}
                    onDeleteRequest={(p) => setProjectToDelete(p)}
                    onLike={handleLike}
                    onVisit={handleVisit}
                  />
                ))}
              </div>
            )}
          </>
        )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* THÔNG TIN TÁC GIẢ */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-5">
              {t.footerAuthorInfo ?? 'Author Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
              <div className="space-y-1.5 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">
                    {t.footerAuthorDev ?? 'Author & Development'}:
                  </span>
                  <span className="ml-1.5">Lê Thanh Liêm</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    {t.footerField ?? 'Field'}:
                  </span>
                  <span className="ml-1.5">
                    {t.footerFieldValue ?? 'Education · STEM · Technology · AI'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    {t.footerLocation ?? 'Location'}:
                  </span>
                  <span className="ml-1.5">
                    {t.footerLocationValue ?? 'Cần Thơ City, Vietnam'}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">
                  {t.footerContact ?? 'Contact'}:
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    {t.footerEmail ?? 'Email'}:
                  </span>
                  <a
                    href="mailto:ltliem89@gmail.com"
                    className="ml-1.5 text-indigo-600 hover:underline"
                  >
                    ltliem89@gmail.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    {t.footerWorkEmail ?? 'Work Email'}:
                  </span>
                  <a
                    href="mailto:liemlt2@fe.edu.vn"
                    className="ml-1.5 text-indigo-600 hover:underline"
                  >
                    liemlt2@fe.edu.vn
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    {t.footerPhone ?? 'Phone / Zalo / LINE'}:
                  </span>
                  <a
                    href="tel:0978152896"
                    className="ml-1.5 text-indigo-600 hover:underline"
                  >
                    0978152896
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Bản quyền */}
          <div className="pt-6 border-t border-slate-100">
            <p className="text-[13px] font-semibold text-slate-800">
              © {new Date().getFullYear()} Lê Thanh Liêm. All rights reserved.
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {t.footerCopyrightNote ??
                'The design, content and development of this website belong to the author, except for third-party components, libraries, resources or content used under their respective licenses.'}
            </p>
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      <QRCodeModal
        project={selectedQRProject}
        isOpen={!!selectedQRProject}
        onClose={() => setSelectedQRProject(null)}
        lang={lang}
        isAdmin={isAdmin}
      />

      {/* Website Submission Modal (cũng dùng cho Admin chỉnh sửa bài) */}
      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmitNewProject}
        editingProject={editingProject}
        onUpdate={handleUpdateProject}
        lang={lang}
        isAdmin={isAdmin}
      />

      {/* Admin Panel & Moderation Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={handleSetIsAdmin}
        projects={projects}
        onApprove={handleApprove}
        onReject={handleReject}
        onDeleteRequest={(p) => setProjectToDelete(p)}
        onUpdateProject={handleUpdateProject}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onSyncProjects={(syncedProjects) => setProjects(syncedProjects)}
        onRefreshPending={syncFromSupabase}
        communityOnly={communityOnly}
        onCommunityOnlyChange={handleCommunityOnlyChange}
        lang={lang}
      />

      {/* Delete Confirmation Modal (Admin safety requirement) */}
      <DeleteConfirmModal
        project={projectToDelete}
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        lang={lang}
      />
    </div>
  );
}

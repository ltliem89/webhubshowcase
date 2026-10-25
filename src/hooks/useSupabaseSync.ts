import { useEffect, useState, useCallback } from 'react';
import { WebProject } from '../types';
import { INITIAL_PROJECTS } from '../data/initialData';
import {
  supabase,
  fetchProjectsFromSupabase,
  fetchSubmissionsFromSupabase,
  submitToSupabase,
  upsertProjectToSupabase,
  approveSubmissionInSupabase,
  rejectSubmissionInSupabase,
  deleteProjectFromSupabase,
  incrementProjectStat,
} from '../services/supabaseClient';

const CACHE_KEY = 'webhub_projects_supabase_cache';

export function useSupabaseSync() {
  const [projects, setProjects] = useState<WebProject[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROJECTS;
  });

  const [submissions, setSubmissions] = useState<WebProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tải dữ liệu từ Supabase
  const loadDataFromCloud = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cloudProjects, cloudSubs] = await Promise.all([
        fetchProjectsFromSupabase(),
        fetchSubmissionsFromSupabase(),
      ]);

      if (cloudProjects && cloudProjects.length > 0) {
        setProjects(cloudProjects);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cloudProjects));
        } catch {}
      }
      if (cloudSubs) {
        setSubmissions(cloudSubs);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu từ Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lắng nghe thay đổi thời gian thực (Supabase Realtime)
  useEffect(() => {
    loadDataFromCloud();

    const channel = supabase
      .channel('public:projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          loadDataFromCloud();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDataFromCloud]);

  // 1. Gửi bài nộp mới
  const handleAddNewProject = async (
    newProj: Omit<WebProject, 'id' | 'createdAt' | 'views' | 'likes'>
  ): Promise<boolean> => {
    const id = 'proj-' + Date.now();
    const project: WebProject = {
      ...newProj,
      id,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      status: 'pending',
      isUserSubmission: true,
    };

    const success = await submitToSupabase(project);
    if (success) {
      setSubmissions((prev) => [project, ...prev.filter((p) => p.id !== id)]);
    }
    return success;
  };

  // 2. Admin duyệt bài
  const handleApproveProject = async (id: string): Promise<boolean> => {
    const target = submissions.find((s) => s.id === id) || projects.find((p) => p.id === id);
    if (!target) return false;

    const approved: WebProject = {
      ...target,
      status: 'approved',
      isUserSubmission: true,
    };

    const success = await approveSubmissionInSupabase(approved);
    if (success) {
      setProjects((prev) => [approved, ...prev.filter((p) => p.id !== id)]);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    return success;
  };

  // 3. Admin từ chối bài
  const handleRejectSubmission = async (id: string): Promise<boolean> => {
    const success = await rejectSubmissionInSupabase(id);
    if (success) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    return success;
  };

  // 4. Admin cập nhật dự án
  const handleUpdateProject = async (updated: WebProject): Promise<boolean> => {
    const existing = projects.find((p) => p.id === updated.id);

    let previewImageHistory = existing?.previewImageHistory || [];
    if (existing && existing.previewImage && existing.previewImage !== updated.previewImage) {
      if (!previewImageHistory.includes(existing.previewImage)) {
        previewImageHistory = [existing.previewImage, ...previewImageHistory];
      }
    }

    const merged: WebProject = {
      ...updated,
      previewImageHistory,
      views: existing ? Math.max(existing.views, updated.views) : updated.views,
      likes: existing ? Math.max(existing.likes, updated.likes) : updated.likes,
    };

    const success = await upsertProjectToSupabase(merged);
    if (success) {
      setProjects((prev) => prev.map((p) => (p.id === merged.id ? merged : p)));
    }
    return success;
  };

  // 5. Admin xóa dự án
  const handleDeleteProject = async (id: string): Promise<boolean> => {
    const success = await deleteProjectFromSupabase(id);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    return success;
  };

  // 6. Tăng views / likes
  const handleIncrementStat = async (id: string, field: 'views' | 'likes') => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newVal = p[field] + 1;
          incrementProjectStat(id, field, p[field]);
          return { ...p, [field]: newVal };
        }
        return p;
      })
    );
  };

  return {
    projects,
    setProjects,
    submissions,
    setSubmissions,
    isLoading,
    loadDataFromCloud,
    handleAddNewProject,
    handleApproveProject,
    handleRejectSubmission,
    handleUpdateProject,
    handleDeleteProject,
    handleIncrementStat,
  };
}

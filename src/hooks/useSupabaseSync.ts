import { useEffect, useState } from 'react';
import { WebProject } from './types';
import { INITIAL_PROJECTS } from './data/initialData';
import { supabase } from './services/supabaseClient'; // Import client hiện có
import { 
  fetchProjectsFromSupabase, 
  fetchSubmissionsFromSupabase,
  submitToSupabase,
  upsertProjectToSupabase,
  deleteProjectFromSupabase,
  rejectSubmissionInSupabase,
  incrementProjectStat
} from './services/supabaseClient';

export function useSupabaseSync() {
  const [projects, setProjects] = useState<WebProject[]>(() => {
    // Khởi tạo tạm từ localStorage hoặc INITIAL_PROJECTS trong lúc chờ fetch Supabase
    try {
      const saved = localStorage.getItem('webhub_projects_supabase_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROJECTS;
  });

  const [submissions, setSubmissions] = useState<WebProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tải dữ liệu thật từ Supabase khi mở app
  const loadDataFromCloud = async () => {
    try {
      setIsLoading(true);
      const cloudProjects = await fetchProjectsFromSupabase();
      const cloudSubs = await fetchSubmissionsFromSupabase();

      if (cloudProjects && cloudProjects.length > 0) {
        setProjects(cloudProjects);
        localStorage.setItem('webhub_projects_supabase_cache', JSON.stringify(cloudProjects));
      }
      if (cloudSubs) {
        setSubmissions(cloudSubs);
      }
    } catch (err) {
      console.error('Lỗi kết nối Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromCloud();

    // Thiết lập Realtime subscription
    const channel = supabase
      .channel('webhub:public')
      .on(
        'broadcast',
        { event: 'webhub_changed' },
        () => {
          console.log('Nhận tín hiệu thay đổi dữ liệu từ Realtime');
          loadDataFromCloud(); // Tải lại danh sách khi có thay đổi
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Đã đăng ký Realtime Realtime thành công!');
        }
      });

    // Cleanup khi component bị hủy
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 1. Thêm / Nộp bài mới -> Lưu thẳng vào bảng submissions trên Supabase
  const handleAddNewProject = async (newProj: Omit<WebProject, 'id' | 'createdAt' | 'views' | 'likes'>): Promise<boolean> => {
    const id = 'proj-' + Date.now();
    const project: WebProject = {
      ...newProj,
      id,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      status: 'pending',
    };

    const success = await submitToSupabase(project);
    if (success) {
      setSubmissions((prev) => [project, ...prev]);
    }
    return success;
  };

  // 2. Admin duyệt bài từ submissions sang projects
  const handleApproveProject = async (id: string): Promise<boolean> => {
    const target = submissions.find((s) => s.id === id) || projects.find((p) => p.id === id);
    if (!target) return false;

    const approved: WebProject = {
      ...target,
      status: 'approved',
      isUserSubmission: true,
    };

    const success = await upsertProjectToSupabase(approved);
    if (success) {
      // Xóa khỏi submissions trên Supabase
      await rejectSubmissionInSupabase(id);
      
      setProjects((prev) => [approved, ...prev.filter((p) => p.id !== id)]);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    return success;
  };

  // 3. Admin từ chối bài nộp
  const handleRejectSubmission = async (id: string): Promise<boolean> => {
    const success = await rejectSubmissionInSupabase(id);
    if (success) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    return success;
  };

  // 4. Admin chỉnh sửa / cập nhật dự án (bao gồm đổi ảnh đại diện mới + lưu ảnh cũ vào history)
  const handleUpdateProject = async (updated: WebProject): Promise<boolean> => {
    const existing = projects.find((p) => p.id === updated.id);
    
    // Xử lý lịch sử ảnh đại diện khi có ảnh mới khác ảnh cũ
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

  // 6. Tăng views / likes trực tiếp trên cloud
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
    submissions,
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

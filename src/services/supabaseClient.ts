import { createClient } from '@supabase/supabase-js';
import { WebProject } from '../types';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mezcsiaozymspbroflye.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Rzq-U1RYiZTiTX6IbFNnFA_xOT6_3ba';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_SUBMISSIONS_STORAGE_KEY = 'webhub_local_submissions';

// Chuyển đổi dữ liệu từ Postgres (snake_case) sang WebProject (camelCase)
export function rowToProject(row: any): WebProject {
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    url: String(row.url || ''),
    description: String(row.description || ''),
    country: String(row.country || 'VN'),
    category: (row.category as any) || 'general',
    educationLevel: (row.education_level as any) || 'all',
    status: (row.status as any) || 'approved',
    isFamous: Boolean(row.is_famous),
    authorName: String(row.author_name || 'Thành viên'),
    authorContact: String(row.author_contact || ''),
    createdAt: row.created_at || new Date().toISOString(),
    previewImage: row.preview_image || '',
    previewImageHistory: Array.isArray(row.preview_image_history) ? row.preview_image_history : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    views: Number(row.views || 0),
    likes: Number(row.likes || 0),
    isUserSubmission: Boolean(row.is_user_submission),
    goLink: row.go_link || '',
  };
}

// Chuyển đổi WebProject sang định dạng Postgres projects
export function projectToRow(project: WebProject): any {
  return {
    id: project.id,
    title: project.title,
    url: project.url,
    description: project.description,
    country: project.country,
    category: project.category,
    education_level: project.educationLevel,
    status: project.status,
    is_famous: Boolean(project.isFamous),
    author_name: project.authorName,
    author_contact: project.authorContact || '',
    created_at: project.createdAt || new Date().toISOString(),
    preview_image: project.previewImage || '',
    preview_image_history: project.previewImageHistory || [],
    tags: project.tags || [],
    views: project.views || 0,
    likes: project.likes || 0,
    is_user_submission: Boolean(project.isUserSubmission),
    go_link: project.goLink || '',
  };
}

/**
 * 1. Tải danh sách project đã duyệt từ Supabase (bảng projects & webhub)
 */
export async function fetchProjectsFromSupabase(): Promise<WebProject[]> {
  try {
    const [pRes, wRes] = await Promise.allSettled([
      supabase
        .from('projects')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      supabase
        .from('webhub')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
    ]);

    const projectsData = pRes.status === 'fulfilled' && pRes.value.data ? pRes.value.data : [];
    const webhubData = wRes.status === 'fulfilled' && wRes.value.data ? wRes.value.data : [];

    const combined = [...projectsData, ...webhubData];
    const uniqueMap = new Map<string, WebProject>();

    for (const row of combined) {
      const proj = rowToProject(row);
      if (!uniqueMap.has(proj.id)) {
        uniqueMap.set(proj.id, proj);
      }
    }

    return Array.from(uniqueMap.values());
  } catch (err) {
    console.error('Lỗi kết nối tải dữ liệu từ Supabase:', err);
    return [];
  }
}

/**
 * 2. Tải danh sách bài chờ duyệt (submissions)
 */
export async function fetchSubmissionsFromSupabase(): Promise<WebProject[]> {
  const localList: WebProject[] = (() => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const cloudSubs = data.map((row) => ({
        ...rowToProject(row),
        status: (row.status as any) || 'pending',
        isUserSubmission: true,
      }));

      // Merge cloud submissions and local cache
      const subMap = new Map<string, WebProject>();
      for (const s of cloudSubs) subMap.set(s.id, s);
      for (const s of localList) {
        if (!subMap.has(s.id)) subMap.set(s.id, s);
      }
      return Array.from(subMap.values());
    }
  } catch (err) {
    console.warn('Lỗi đọc submissions từ Supabase:', err);
  }

  return localList;
}

/**
 * 3. Người dùng gửi bài nộp mới vào Supabase
 */
export async function submitToSupabase(project: WebProject): Promise<boolean> {
  const submissionRow = {
    id: project.id,
    title: project.title,
    url: project.url,
    description: project.description || '',
    country: project.country || 'VN',
    category: project.category || 'general',
    education_level: project.educationLevel || 'all',
    status: 'pending',
    is_famous: false,
    author_name: project.authorName || 'Thành viên',
    author_contact: project.authorContact || '',
    created_at: project.createdAt || new Date().toISOString(),
    preview_image: project.previewImage || '',
    tags: project.tags || [],
    go_link: project.goLink || '',
  };

  // 1. Lưu vào Supabase submissions
  try {
    const { error } = await supabase.from('submissions').insert([submissionRow]);
    if (error) {
      console.warn('Cảnh báo ghi submissions lên Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Lỗi gửi bài lên Supabase:', err);
  }

  // 2. Lưu vào local cache để hiển thị tức thì
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_STORAGE_KEY);
    const list: WebProject[] = raw ? JSON.parse(raw) : [];
    const pendingProject: WebProject = {
      ...project,
      status: 'pending',
      isUserSubmission: true,
    };
    const updated = [pendingProject, ...list.filter((p) => p.id !== project.id)];
    localStorage.setItem(LOCAL_SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Lỗi cache bài nộp local:', e);
  }

  return true;
}

/**
 * 4. Admin lưu / cập nhật dự án trực tiếp vào Supabase
 */
export async function upsertProjectToSupabase(project: WebProject): Promise<boolean> {
  const row = projectToRow(project);
  try {
    const { error } = await supabase.from('projects').upsert([row], { onConflict: 'id' });
    if (error) {
      console.error('Lỗi cập nhật project lên Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Lỗi kết nối upsertProjectToSupabase:', err);
    return false;
  }
}

/**
 * 5. Admin duyệt bài từ submissions đưa sang projects
 */
export async function approveSubmissionInSupabase(project: WebProject): Promise<boolean> {
  const approvedProject: WebProject = {
    ...project,
    status: 'approved',
    isUserSubmission: true,
  };
  const row = projectToRow(approvedProject);

  // 1. Ghi vào projects bảng chính
  try {
    const { error: insError } = await supabase.from('projects').upsert([row], { onConflict: 'id' });
    if (insError) {
      console.error('Lỗi duyệt bài vào projects:', insError);
      return false;
    }
  } catch (err) {
    console.error('Lỗi gọi approveSubmissionInSupabase:', err);
    return false;
  }

  // 2. Xóa khỏi submissions trên Supabase
  try {
    await supabase.from('submissions').delete().eq('id', project.id);
  } catch {}

  // 3. Xóa khỏi local submissions cache
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const list: WebProject[] = JSON.parse(raw);
      const filtered = list.filter((p) => p.id !== project.id);
      localStorage.setItem(LOCAL_SUBMISSIONS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {}

  return true;
}

/**
 * 6. Admin từ chối bài nộp
 */
export async function rejectSubmissionInSupabase(id: string): Promise<boolean> {
  try {
    await supabase.from('submissions').delete().eq('id', id);
  } catch {}

  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const list: WebProject[] = JSON.parse(raw);
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_SUBMISSIONS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {}

  return true;
}

/**
 * 7. Admin xóa dự án khỏi Supabase
 */
export async function deleteProjectFromSupabase(id: string): Promise<boolean> {
  try {
    const [pDel, wDel] = await Promise.allSettled([
      supabase.from('projects').delete().eq('id', id),
      supabase.from('webhub').delete().eq('id', id),
    ]);
    const pError = pDel.status === 'fulfilled' ? pDel.value.error : null;
    const wError = wDel.status === 'fulfilled' ? wDel.value.error : null;

    if (pError && wError) {
      console.error('Lỗi xóa project khỏi Supabase:', pError, wError);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Lỗi xóa project khỏi Supabase:', err);
    return false;
  }
}

/**
 * 8. Tăng views / likes trực tiếp lên Supabase
 */
export async function incrementProjectStat(
  id: string,
  field: 'views' | 'likes',
  currentVal: number
): Promise<void> {
  try {
    await supabase
      .from('projects')
      .update({ [field]: currentVal + 1 })
      .eq('id', id);
  } catch (err) {
    console.warn(`Lỗi cập nhật ${field} trên Supabase:`, err);
  }
}

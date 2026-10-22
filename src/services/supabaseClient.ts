import { createClient } from '@supabase/supabase-js';
import { WebProject } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mezcsiaozymspbroflye.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Rzq-U1RYiZTiTX6IbFNnFA_xOT6_3ba';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Chuyển đổi dữ liệu từ Postgres (snake_case) sang WebProject (camelCase)
export function rowToProject(row: any): WebProject {
  return {
    id: row.id,
    title: row.title || '',
    url: row.url || '',
    description: row.description || '',
    country: row.country || 'VN',
    category: row.category || 'general',
    educationLevel: row.education_level || 'all',
    status: (row.status as any) || 'approved',
    isFamous: Boolean(row.is_famous),
    authorName: row.author_name || 'Thành viên',
    authorContact: row.author_contact || '',
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

// Chuyển đổi WebProject sang định dạng Postgres
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

// 1. Tải danh sách project đã duyệt
export async function fetchProjectsFromSupabase(): Promise<WebProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi tải projects từ Supabase:', error);
    return [];
  }
  return (data || []).map(rowToProject);
}

// 2. Tải danh sách submissions (cho Admin duyệt)
export async function fetchSubmissionsFromSupabase(): Promise<WebProject[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi tải submissions từ Supabase:', error);
    return [];
  }
  return (data || []).map((row) => ({
    ...rowToProject(row),
    status: (row.status as any) || 'pending',
  }));
}

// 3. Người dùng gửi bài nộp mới vào submissions
export async function submitToSupabase(project: WebProject): Promise<boolean> {
  const row = {
    id: project.id,
    title: project.title,
    url: project.url,
    description: project.description,
    country: project.country,
    category: project.category,
    education_level: project.educationLevel,
    status: 'pending',
    is_famous: false,
    author_name: project.authorName,
    author_contact: project.authorContact || '',
    created_at: new Date().toISOString(),
    preview_image: project.previewImage || '',
    preview_image_history: project.previewImageHistory || [],
    tags: project.tags || [],
    go_link: project.goLink || '',
  };

  const { error } = await supabase.from('submissions').insert([row]);
  if (error) {
    console.error('Lỗi khi nộp bài vào Supabase:', error);
    return false;
  }
  return true;
}

// 4. Admin lưu / chỉnh sửa dự án (cập nhật trực tiếp lên Supabase projects)
export async function upsertProjectToSupabase(project: WebProject): Promise<boolean> {
  const row = projectToRow(project);
  const { error } = await supabase.from('projects').upsert([row], { onConflict: 'id' });
  if (error) {
    console.error('Lỗi lưu project vào Supabase:', error);
    return false;
  }
  return true;
}

// 5. Admin duyệt bài từ submissions đưa sang projects
export async function approveSubmissionInSupabase(project: WebProject): Promise<boolean> {
  const approvedProject: WebProject = {
    ...project,
    status: 'approved',
    isUserSubmission: true,
  };
  const row = projectToRow(approvedProject);

  // Thêm / cập nhật vào bảng projects
  const { error: insertError } = await supabase.from('projects').upsert([row], { onConflict: 'id' });
  if (insertError) {
    console.error('Lỗi đưa bài duyệt vào projects:', insertError);
    return false;
  }

  // Xóa hoặc đổi trạng thái trong submissions
  const { error: delError } = await supabase.from('submissions').delete().eq('id', project.id);
  if (delError) {
    console.warn('Lỗi dọn submissions sau duyệt:', delError);
  }
  return true;
}

// 6. Admin từ chối bài nộp
export async function rejectSubmissionInSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) {
    console.error('Lỗi từ chối submission trong Supabase:', error);
    return false;
  }
  return true;
}

// 7. Admin xóa dự án khỏi bảng projects
export async function deleteProjectFromSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    console.error('Lỗi xóa project khỏi Supabase:', error);
    return false;
  }
  return true;
}

// 8. Tăng views / likes
export async function incrementProjectStat(id: string, field: 'views' | 'likes', currentVal: number): Promise<void> {
  await supabase
    .from('projects')
    .update({ [field]: currentVal + 1 })
    .eq('id', id);
}

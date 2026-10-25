import { WebProject } from '../types';
import { ensureGoLink } from '../utils/goLink';

/**
 * URL ứng dụng Google Apps Script Web App (kết nối trực tiếp tới Google Sheet bảng đợi)
 */
export const GOOGLE_SHEET_APPSCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxeY4iM95zJyy0wkjE4OvRwU5gI4XgTRM_RM1TIJuGTRI0CCSPgq4KRFt2X2EiQ6PAg/exec';

/**
 * Gửi dự án người dùng đăng tải trực tiếp vào bảng đợi của Google Sheet (tab WebHub_Submissions)
 */
export async function submitProjectToGoogleSheet(project: WebProject): Promise<boolean> {
  if (!GOOGLE_SHEET_APPSCRIPT_URL) return false;

  try {
    const projectWithGo = ensureGoLink(project);
    await fetch(GOOGLE_SHEET_APPSCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'addProject',
        project: projectWithGo,
      }),
    });
    return true;
  } catch (err) {
    console.warn('Gửi dự án lên bảng đợi Google Sheet thất bại:', err);
    return false;
  }
}

/**
 * Lấy danh sách các bài đăng đang chờ duyệt từ bảng đợi Google Sheet (tab WebHub_Submissions)
 */
export async function fetchSubmissionsFromGoogleSheet(): Promise<WebProject[]> {
  if (!GOOGLE_SHEET_APPSCRIPT_URL) return [];

  try {
    const res = await fetch(`${GOOGLE_SHEET_APPSCRIPT_URL}?action=getSubmissions`, {
      method: 'GET',
    });
    if (!res.ok) return [];

    const json = await res.json();
    if (!json || !Array.isArray(json.data)) return [];

    return json.data.map((row: any) => {
      // Chuẩn hóa dữ liệu từ hàng Google Sheet
      const tags = Array.isArray(row.tags)
        ? row.tags
        : typeof row.tags === 'string'
        ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      return {
        id: String(row.id || `proj-${Date.now()}`),
        title: String(row.title || 'Mô phỏng chưa đặt tên'),
        url: String(row.url || ''),
        description: String(row.description || ''),
        country: (row.country as any) || 'VN',
        category: (row.category as any) || 'physics',
        educationLevel: (row.educationLevel as any) || 'general',
        status: (row.status as any) || 'pending',
        isFamous: false,
        isUserSubmission: true,
        authorName: String(row.authorName || 'Tác giả cộng đồng'),
        authorContact: String(row.authorContact || ''),
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
        previewImage: row.previewImage || undefined,
        tags,
        views: Number(row.views || 1),
        likes: Number(row.likes || 0),
        goLink: String(row.goLink || ''),
      } as WebProject;
    });
  } catch (err) {
    console.warn('Lỗi khi tải bài chờ duyệt từ Google Sheet:', err);
    return [];
  }
}

/**
 * Cập nhật trạng thái duyệt bài (approved/rejected) lên Google Sheet
 */
export async function updateProjectStatusOnGoogleSheet(
  projectId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  if (!GOOGLE_SHEET_APPSCRIPT_URL || !projectId) return;

  try {
    await fetch(GOOGLE_SHEET_APPSCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'updateStatus',
        projectId,
        status,
      }),
    });
  } catch (err) {
    console.warn('Lỗi cập nhật trạng thái lên Google Sheet:', err);
  }
}

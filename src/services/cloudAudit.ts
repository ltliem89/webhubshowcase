import { WebProject } from '../types';
import { INITIAL_PROJECTS } from '../data/initialData';

export interface SupabaseAuditDiscrepancy {
  id: string;
  title: string;
  field: string;
  localVal: any;
  cloudVal: any;
}

export interface SupabaseAuditReport {
  lastSyncedAt: string;          // formatted e.g. "22:55:10 26/10/2026"
  timestamp: number;
  totalCloudProjects: number;
  totalActiveProjects: number;
  discrepanciesCount: number;
  discrepancies: SupabaseAuditDiscrepancy[];
  newProjects: string[];
  removedProjects: string[];
  status: 'synced' | 'diverged' | 'scanning' | 'error';
  summary: string;
}

export const normalizeUrl = (u: string) => (u || '').toLowerCase().trim().replace(/\/+$/, '');

/**
 * Rà soát và đối soát dữ liệu đối ứng giữa Local State và Supabase Cloud (Single Source of Truth).
 * Bất kỳ hiệu chỉnh nào trên Supabase (views, likes, created_at, tags, is_featured, title, description, url, preview_image,...)
 * đều được cập nhật ngay lập tức vào state và localStorage.
 */
export function auditAndReconcileWithCloud(
  cloudProjects: WebProject[],
  localProjects: WebProject[],
  cloudSubs: WebProject[] = [],
  sheetSubs: WebProject[] = []
): {
  reconciled: WebProject[];
  report: SupabaseAuditReport;
} {
  const now = new Date();
  const timeFormatted =
    now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' ' +
    now.toLocaleDateString('vi-VN');

  const localMap = new Map<string, WebProject>();
  const localUrlMap = new Map<string, WebProject>();
  for (const p of localProjects) {
    localMap.set(p.id, p);
    const nUrl = normalizeUrl(p.url);
    if (nUrl) localUrlMap.set(nUrl, p);
  }

  const discrepancies: SupabaseAuditDiscrepancy[] = [];
  const newProjects: string[] = [];
  const cloudIdSet = new Set<string>();
  const cloudUrlSet = new Set<string>();

  // 1. Rà soát từng dự án từ Supabase (SSOT)
  const reconciledCloud: WebProject[] = cloudProjects.map((cp) => {
    cloudIdSet.add(cp.id);
    const nUrl = normalizeUrl(cp.url);
    if (nUrl) cloudUrlSet.add(nUrl);

    const localMatch = localMap.get(cp.id) || (nUrl ? localUrlMap.get(nUrl) : undefined);

    if (!localMatch) {
      newProjects.push(`"${cp.title}" (ID: ${cp.id})`);
    } else {
      // Đối chiếu từng trường dữ liệu để phát hiện sai lệch (discrepancy)
      const fieldsToCheck: (keyof WebProject)[] = [
        'title',
        'description',
        'url',
        'createdAt',
        'previewImage',
        'views',
        'likes',
        'isFeatured',
        'goLink',
        'status',
        'category',
        'educationLevel',
        'is3D',
      ];

      for (const field of fieldsToCheck) {
        const localVal = localMatch[field];
        const cloudVal = cp[field];

        if (localVal !== cloudVal && cloudVal !== undefined) {
          discrepancies.push({
            id: cp.id,
            title: cp.title,
            field,
            localVal,
            cloudVal,
          });
        }
      }

      // Kiểm tra tags
      const localTags = JSON.stringify(localMatch.tags || []);
      const cloudTags = JSON.stringify(cp.tags || []);
      if (localTags !== cloudTags) {
        discrepancies.push({
          id: cp.id,
          title: cp.title,
          field: 'tags',
          localVal: localTags,
          cloudVal: cloudTags,
        });
      }
    }

    // Giá trị từ Supabase luôn là chân lý (Single Source of Truth)
    return {
      ...cp,
      isUserSubmission: cp.isUserSubmission ?? (cp.status === 'approved' && !cp.isFamous),
    };
  });

  // 2. Rà soát các dự án đã bị xóa trên Supabase
  const removedProjects: string[] = [];
  for (const lp of localProjects) {
    const nUrl = normalizeUrl(lp.url);
    // Nếu là bài cộng đồng mà không còn trong Supabase thì đánh dấu đã bị xóa trên Cloud
    if (lp.isUserSubmission && !lp.isFamous && !cloudIdSet.has(lp.id) && (!nUrl || !cloudUrlSet.has(nUrl))) {
      removedProjects.push(`"${lp.title}" (ID: ${lp.id})`);
    }
  }

  // 3. Giữ lại các nền tảng quốc tế (isFamous) từ INITIAL_PROJECTS nếu chưa có trong Cloud
  const famousToAdd: WebProject[] = [];
  for (const init of INITIAL_PROJECTS) {
    if (!init.isFamous) continue;
    const nUrl = normalizeUrl(init.url);
    if (!cloudIdSet.has(init.id) && (!nUrl || !cloudUrlSet.has(nUrl))) {
      famousToAdd.push(init);
      cloudIdSet.add(init.id);
      if (nUrl) cloudUrlSet.add(nUrl);
    }
  }

  // 4. Giữ lại các bài đang chờ duyệt (pending/rejected) từ submissions nếu chưa trùng URL
  const pendingToAdd: WebProject[] = [];
  const submissions = [
    ...(cloudSubs || []),
    ...(sheetSubs || []),
    ...localProjects.filter((p) => p.status === 'pending' || p.status === 'rejected'),
  ];
  for (const sub of submissions) {
    const nUrl = normalizeUrl(sub.url);
    if (!cloudIdSet.has(sub.id) && (!nUrl || !cloudUrlSet.has(nUrl))) {
      pendingToAdd.push(sub);
      cloudIdSet.add(sub.id);
      if (nUrl) cloudUrlSet.add(nUrl);
    }
  }

  const finalReconciled = [...reconciledCloud, ...famousToAdd, ...pendingToAdd];

  const totalDiscrepancies = discrepancies.length + newProjects.length + removedProjects.length;

  const report: SupabaseAuditReport = {
    lastSyncedAt: timeFormatted,
    timestamp: now.getTime(),
    totalCloudProjects: cloudProjects.length,
    totalActiveProjects: finalReconciled.length,
    discrepanciesCount: totalDiscrepancies,
    discrepancies,
    newProjects,
    removedProjects,
    status: 'synced',
    summary:
      totalDiscrepancies > 0
        ? `Đã rà soát ${cloudProjects.length} dự án từ Supabase. Phát hiện và tự động đồng bộ ${totalDiscrepancies} thay đổi (${discrepancies.length} sai lệch trường, ${newProjects.length} dự án mới, ${removedProjects.length} dự án đã gỡ).`
        : `Đã rà soát ${cloudProjects.length} dự án từ Supabase. Dữ liệu trên web đã hoàn toàn khớp 100% với Cloud.`,
  };

  return {
    reconciled: finalReconciled,
    report,
  };
}

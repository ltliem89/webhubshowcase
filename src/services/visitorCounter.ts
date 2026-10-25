import { supabase } from './supabaseClient';

const STATS_ROW_ID = 'system-site-stats';
const SESSION_VISITED_KEY = 'webhub_visited_session';

/**
 * Lấy tổng số lượt truy cập trang web từ Supabase
 */
export async function getGlobalVisitorCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('webhub')
      .select('views')
      .eq('id', STATS_ROW_ID)
      .maybeSingle();

    if (error || !data) {
      return 1;
    }
    return Number(data.views || 1);
  } catch {
    return 1;
  }
}

/**
 * Ghi nhận lượt truy cập mới vào Supabase
 * Sử dụng sessionStorage để không tăng ảo khi người dùng F5 / reload liên tục trong cùng 1 phiên
 */
export async function incrementVisitorCount(): Promise<number> {
  try {
    const hasVisited = sessionStorage.getItem(SESSION_VISITED_KEY);

    // 1. Lấy số lượt hiện tại
    const { data: current } = await supabase
      .from('webhub')
      .select('views')
      .eq('id', STATS_ROW_ID)
      .maybeSingle();

    const currentViews = current?.views ? Number(current.views) : 1;

    // Nếu đã truy cập trong phiên này thì trả về số hiện tại, không tăng thêm
    if (hasVisited) {
      return currentViews;
    }

    sessionStorage.setItem(SESSION_VISITED_KEY, 'true');
    const nextViews = currentViews + 1;

    if (!current) {
      await supabase.from('webhub').insert([
        {
          id: STATS_ROW_ID,
          title: 'Global Site Visits',
          url: 'https://webhubshowcase-pmcaf.vercel.app',
          status: 'system',
          views: nextViews,
        },
      ]);
    } else {
      await supabase
        .from('webhub')
        .update({ views: nextViews })
        .eq('id', STATS_ROW_ID);
    }

    return nextViews;
  } catch (err) {
    console.error('Lỗi cập nhật visitor count:', err);
    return 1;
  }
}

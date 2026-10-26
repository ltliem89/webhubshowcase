import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://mezcsiaozymspbroflye.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_Rzq-U1RYiZTiTX6IbFNnFA_xOT6_3ba';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * GET /api/version
 * Trạm tình báo phiên bản siêu nhẹ (Ultra-low bandwidth version sentinel).
 * Trả về ETag và kiểm tra 304 Not Modified để client không tốn băng thông khi dữ liệu chưa đổi.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Cho phép CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-None-Match');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // Chỉ truy vấn các trường tối thiểu: id, created_at, views, likes
    const { data: webhub, error } = await supabase
      .from('webhub')
      .select('id, created_at, views, likes')
      .order('created_at', { ascending: false });

    if (error || !webhub) {
      throw error || new Error('No data received from webhub table');
    }

    const count = webhub.length;
    const maxCreatedAt = webhub[0]?.created_at || '';
    const maxTime = maxCreatedAt ? new Date(maxCreatedAt).getTime() : 0;
    const sumStats = webhub.reduce(
      (acc, r) => acc + (Number(r.views) || 0) + (Number(r.likes) || 0),
      0
    );

    // Sinh mã băm định danh phiên bản
    const etag = `"v20_${count}_${maxTime}_${sumStats}"`;

    // Kiểm tra ETag từ Client (Conditional GET)
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && (clientEtag === etag || clientEtag === `W/${etag}`)) {
      res.statusCode = 304; // Not Modified: 0 byte payload!
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=20, stale-while-revalidate=30');
      res.end();
      return;
    }

    // Khi có thay đổi hoặc truy vấn lần đầu
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=20, stale-while-revalidate=30');

    res.end(
      JSON.stringify({
        version: etag.replace(/"/g, ''),
        count,
        latestCreatedAt: maxCreatedAt,
        sumStats,
        timestamp: Date.now(),
        status: 'synced',
      })
    );
  } catch (err: any) {
    console.error('[API Version Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'Failed to inspect database version',
        message: err?.message || String(err),
        timestamp: Date.now(),
      })
    );
  }
}

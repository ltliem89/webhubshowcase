import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * POST or GET /api/facebook-scrape
 * Kích hoạt Facebook Graph API làm mới bản xem trước (Cache Invalidation / Scrape Trigger).
 * Sử dụng khi quản trị viên hoặc hệ thống vừa cập nhật thông tin dự án trên Supabase.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const urlObj = new URL(req.url || '/', 'https://webhubshowcase.vercel.app');
  let targetUrl = urlObj.searchParams.get('url') || '';

  if (!targetUrl && req.method === 'POST') {
    const buffers: Buffer[] = [];
    for await (const chunk of req) {
      buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    try {
      const body = JSON.parse(Buffer.concat(buffers).toString() || '{}');
      targetUrl = body.url || '';
    } catch {}
  }

  if (!targetUrl) {
    targetUrl = 'https://webhubshowcase.vercel.app/';
  }

  try {
    const fbScrapeEndpoint = `https://graph.facebook.com/?id=${encodeURIComponent(targetUrl)}&scrape=true`;
    const fbRes = await fetch(fbScrapeEndpoint, {
      method: 'POST',
      headers: {
        'User-Agent': 'WebHub-Sentinel/1.0',
      },
    });

    const fbData = await fbRes.json();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: true,
        targetUrl,
        facebookResponse: fbData,
        timestamp: Date.now(),
      })
    );
  } catch (err: any) {
    console.error('[Facebook Scrape Trigger Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        error: err?.message || String(err),
        targetUrl,
        timestamp: Date.now(),
      })
    );
  }
}

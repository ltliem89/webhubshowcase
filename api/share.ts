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

function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'telegrambot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'baiduspider',
  'yandexbot',
  'duckduckbot',
];

function isCrawler(userAgent: string): boolean {
  const ua = (userAgent || '').toLowerCase();
  return CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot));
}

/**
 * GET /api/share?id=:projectId
 * Cổng truyền thông OpenGraph động cho Facebook, Zalo, Twitter và người dùng.
 * - Với Bot crawler (Facebook External Hit,...): Trả về thẻ OpenGraph HTML tương ứng với dự án mới nhất từ Supabase.
 * - Với Người dùng duyệt web thông thường: Tự động chuyển hướng vào WebHub và mở dự án.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const urlObj = new URL(req.url || '/', 'https://webhubshowcase.vercel.app');
  const projectId = urlObj.searchParams.get('id') || urlObj.pathname.split('/').pop() || '';

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host =
    (req.headers['x-forwarded-host'] as string) ||
    (req.headers.host as string) ||
    'webhubshowcase.vercel.app';
  const userAgent = (req.headers['user-agent'] as string) || '';

  try {
    let project: any = null;

    if (projectId) {
      // 1. Tìm trong bảng webhub
      const { data: wData } = await supabase
        .from('webhub')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (wData) {
        project = wData;
      } else {
        // 2. Tìm trong bảng projects
        const { data: pData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();
        if (pData) project = pData;
      }
    }

    const title = escapeHtml(project?.title || 'WebHub Showcase - Nền tảng mô phỏng giáo dục trực tuyến');
    const description = escapeHtml(
      project?.description ||
        'Nền tảng chia sẻ website và mô phỏng giáo dục trực tuyến với mã QR, chế độ xem rút gọn và phân loại mô phỏng nổi tiếng.'
    );
    const author = escapeHtml(project?.author_name || 'WebHub Community');
    
    let imageUrl = project?.preview_image || `${proto}://${host}/logo.png`;
    if (imageUrl.startsWith('/')) {
      imageUrl = `${proto}://${host}${imageUrl}`;
    }
    imageUrl = escapeHtml(imageUrl);

    const shareUrl = `${proto}://${host}/share/${encodeURIComponent(projectId)}`;
    const destinationUrl = `${proto}://${host}/?p=${encodeURIComponent(projectId)}`;

    // Nếu không phải Crawler thì chuyển hướng người dùng thực đến WebHub
    if (!isCrawler(userAgent)) {
      res.statusCode = 302;
      res.setHeader('Location', destinationUrl);
      res.setHeader('Cache-Control', 'no-cache');
      res.end(`<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${destinationUrl}"></head><body>Đang chuyển hướng...</body></html>`);
      return;
    }

    // Với Social Crawler (Facebook, Zalo,...), trả về HTML chuẩn OpenGraph
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

    res.end(`<!doctype html>
<html lang="vi" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | WebHub Showcase</title>
  <meta name="description" content="${description}" />
  <meta name="author" content="${author}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:title" content="${title} | WebHub Showcase" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:alt" content="${title}" />
  <meta property="og:site_name" content="WebHub Showcase" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${shareUrl}" />
  <meta name="twitter:title" content="${title} | WebHub Showcase" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <link rel="canonical" href="${shareUrl}" />
</head>
<body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #e2e8f0;">
  <h1>${title}</h1>
  <p>${description}</p>
  <p>Tác giả: <strong>${author}</strong></p>
  <img src="${imageUrl}" alt="${title}" style="max-width: 600px; border-radius: 12px; margin: 20px auto; display: block;" />
  <p><a href="${destinationUrl}" style="color: #818cf8; text-decoration: none; font-weight: bold;">Mở ứng dụng WebHub Showcase →</a></p>
</body>
</html>`);
  } catch (err: any) {
    console.error('[API Share Error]:', err);
    res.statusCode = 500;
    res.end('Error loading metadata');
  }
}

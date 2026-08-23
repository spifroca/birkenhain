import type { APIRoute } from 'astro';
import { features } from '../lib/flags';

/**
 * robots.txt, an den Launch-Schalter gebunden. Solange
 * `features.indexable` false ist, wird die ganze Site gesperrt — es
 * stehen Platzhalter-Inhalte drin, die nicht in einen Index gehören.
 *
 * Statischer Endpoint: wird zur Buildzeit gerendert, kein SSR nötig.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? `Sitemap: ${new URL('/sitemap.xml', site).href}` : null;

  const lines = features.indexable
    ? ['User-agent: *', 'Allow: /', '', 'Disallow: /api/', ...(sitemap ? ['', sitemap] : [])]
    : [
        '# Vorschau-Stand, noch nicht zur Veröffentlichung freigegeben.',
        'User-agent: *',
        'Disallow: /',
      ];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};

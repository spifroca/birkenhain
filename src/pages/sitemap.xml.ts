import type { APIRoute } from 'astro';
import { LOCALES, PAGES, pathFor } from '../i18n/routes';
import { features } from '../lib/flags';

/**
 * Sitemap mit xhtml:link-Alternates je Sprachpaar. Speist sich aus
 * `PAGES` und `pathFor`, bleibt also automatisch synchron mit den Routen —
 * keine zweite Liste, die veralten kann.
 *
 * Die Statusseiten der Anmeldung stehen bewusst nicht drin: sie sind
 * Zwischenstationen und tragen `noindex`.
 */
export const GET: APIRoute = ({ site }) => {
  // Ohne Freigabe keine Sitemap-Einträge: die Site ist per robots.txt gesperrt.
  if (!features.indexable || !site) {
    return new Response('', { status: 404 });
  }

  const url = (path: string) => new URL(path, site).href;

  const entries = PAGES.flatMap((page) =>
    LOCALES.map((locale) => {
      const alternates = LOCALES.map(
        (other) =>
          `      <xhtml:link rel="alternate" hreflang="${other === 'de' ? 'de-CH' : 'en'}" href="${url(pathFor(page, other))}" />`,
      ).join('\n');

      return [
        '    <url>',
        `      <loc>${url(pathFor(page, locale))}</loc>`,
        alternates,
        `      <xhtml:link rel="alternate" hreflang="x-default" href="${url(pathFor(page, 'de'))}" />`,
        '    </url>',
      ].join('\n');
    }),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
  ].join('\n');

  return new Response(xml + '\n', {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};

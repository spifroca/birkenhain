import { defineConfig } from 'astro/config';

// Static output: der ganze Screen-Bestand ist zur Buildzeit bekannt.
// Der Formular-Endpoint liegt bewusst daneben (functions/api/) und nicht
// im Astro-Build, damit hier kein Adapter und kein SSR nötig wird.
/**
 * Domain und Basispfad sind ueberschreibbar, damit dieselbe Quelle sowohl
 * im Webroot der Produktionsdomain als auch unter einem Unterpfad laufen
 * kann (GitHub-Pages-Vorschau). Ohne gesetzte Variablen kommt der
 * Produktionsstand heraus — ein `npm run build` ohne Umgebung ist also
 * immer das Richtige.
 *
 * TODO(domain): birkenhain.ch ist aus der Repo-Beschreibung und der
 * DNS-Auflösung erschlossen, nicht bestaetigt. im-birkenhain.ch loest
 * nicht auf. Bitte pruefen — davon haengen Canonical, hreflang, Sitemap
 * und der Double-Opt-In-Link ab.
 */
const SITE = process.env.SITE_ORIGIN || 'https://birkenhain.ch';
const BASE = process.env.SITE_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',

  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    routing: {
      // DE ohne Prefix (/), EN unter /en/.
      prefixDefaultLocale: false,
    },
  },

  image: {
    // sharp erzeugt AVIF und WebP zur Buildzeit.
    service: { entrypoint: 'astro/assets/services/sharp' },
    // Fremd-Hosts absichtlich nicht freigegeben: alle Bilder liegen im Repo.
    domains: [],
    remotePatterns: [],
  },

  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },

  devToolbar: { enabled: false },
});

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
 * Die Domain ist www.birkenhain.ch — live nachgemessen: birkenhain.ch
 * antwortet 301 auf https://www.birkenhain.ch/. Der Canonical muss auf die
 * Adresse zeigen, die tatsaechlich 200 liefert, sonst verweist er auf eine
 * Weiterleitung.
 */
const SITE = process.env.SITE_ORIGIN || 'https://www.birkenhain.ch';
const BASE = process.env.SITE_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  // Der Build erzeugt Verzeichnisse (architektur/index.html), und Apache wie
  // nginx leiten /architektur per 301 auf /architektur/ um. Ohne 'always'
  // erzeugte pathFor() Links ohne Slash — jeder Klick kostete dann einen
  // Redirect-Umweg. Live nachgemessen, nicht vermutet.
  trailingSlash: 'always',

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

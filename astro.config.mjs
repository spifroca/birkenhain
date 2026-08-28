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
 * Die Domain ist birkenhain.ch, ohne www — live nachgemessen am 24.08.2026:
 * https://www.birkenhain.ch/architektur/ antwortet 301 auf
 * https://birkenhain.ch/architektur/, pfadtreu. Vorher war es umgekehrt; die
 * bevorzugte Domain wurde serverseitig umgestellt. Der Canonical muss auf die
 * Adresse zeigen, die tatsaechlich 200 liefert, sonst verweist er auf eine
 * Weiterleitung. Dreht die Einstellung wieder, genuegt SITE_ORIGIN im Build.
 */
const SITE = process.env.SITE_ORIGIN || 'https://birkenhain.ch';
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

  /**
   * Skripte muessen als Datei ausgeliefert werden, nicht inline.
   *
   * Die .htaccess setzt `script-src 'self'` ohne `unsafe-inline`, ohne Nonce
   * und ohne Hash. Ein Inline-Skript weist der Browser damit ab — und genau
   * das geschah live: Astro buendelte die fuenf kleinen Skripte (Burger-Menue,
   * Situationsplan, Sticky-Bar, Scroll-Reveal, Hero-Film) in das HTML, und
   * keines lief. Gemessen am 28.08.2026 mit der echten CSP: «Refused to
   * execute inline script», der Baubereich-Marker blieb auf aria-pressed=false.
   *
   * `assetsInlineLimit: 0` nimmt Vite die Erlaubnis, kleine Buendel in das
   * Dokument zu ziehen. Der Waechter im Schritt «Ausgabe pruefen» der CI
   * prueft das Ergebnis, damit es nicht wieder still zurueckkippt.
   */
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },

  devToolbar: { enabled: false },
});

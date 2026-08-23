import { defineConfig } from 'astro/config';

// Static output: der ganze Screen-Bestand ist zur Buildzeit bekannt.
// Der Formular-Endpoint liegt bewusst daneben (functions/api/) und nicht
// im Astro-Build, damit hier kein Adapter und kein SSR nötig wird.
export default defineConfig({
  site: 'https://im-birkenhain.ch',
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

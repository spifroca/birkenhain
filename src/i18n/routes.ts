export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

/** Stabile Seiten-IDs. Die Slugs pro Sprache haengen daran, nicht umgekehrt. */
export const PAGES = [
  'home',
  'architektur',
  'freiraum',
  'lage',
  'nachhaltigkeit',
  'wohnungen',
  'anmeldung',
  'impressum',
  'datenschutz',
] as const;
export type PageId = (typeof PAGES)[number];

/**
 * Slug pro Seite und Sprache. Leerer String = Wurzel der Sprache.
 * Einzige Quelle fuer Navigation, Sprachumschalter, hreflang und Sitemap.
 */
const SLUGS: Record<PageId, Record<Locale, string>> = {
  home: { de: '', en: '' },
  architektur: { de: 'architektur', en: 'architecture' },
  freiraum: { de: 'freiraum', en: 'open-spaces' },
  lage: { de: 'lage-mobilitaet', en: 'location-mobility' },
  nachhaltigkeit: { de: 'nachhaltigkeit', en: 'sustainability' },
  wohnungen: { de: 'wohnungen', en: 'apartments' },
  anmeldung: { de: 'anmeldung', en: 'register' },
  impressum: { de: 'impressum', en: 'imprint' },
  datenschutz: { de: 'datenschutz', en: 'privacy' },
};

/** Reihenfolge in Header und Footer. `home` ist das Logo, nicht ein Menuepunkt. */
export const NAV: readonly PageId[] = [
  'architektur',
  'freiraum',
  'lage',
  'nachhaltigkeit',
  'wohnungen',
  'anmeldung',
];

/** Fusszeile, rechtliche Spalte. Bewusst nicht in der Hauptnavigation. */
export const LEGAL: readonly PageId[] = ['impressum', 'datenschutz'];

/** Absoluter Pfad einer Seite in einer Sprache, immer mit fuehrendem Slash. */
export function pathFor(page: PageId, locale: Locale): string {
  const slug = SLUGS[page][locale];
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  if (slug === '') return prefix === '' ? '/' : `${prefix}/`;
  return `${prefix}/${slug}`;
}

/** Locale aus einem URL-Pfad lesen. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return LOCALES.includes(first as Locale) ? (first as Locale) : DEFAULT_LOCALE;
}

/** Gegenstueck eines Pfads in der anderen Sprache — fuer den Umschalter. */
export function alternatePath(page: PageId, current: Locale): { locale: Locale; path: string } {
  const other: Locale = current === 'de' ? 'en' : 'de';
  return { locale: other, path: pathFor(page, other) };
}

/** Alle Sprachvarianten einer Seite — fuer hreflang. */
export function alternates(page: PageId): { locale: Locale; path: string }[] {
  return LOCALES.map((locale) => ({ locale, path: pathFor(page, locale) }));
}

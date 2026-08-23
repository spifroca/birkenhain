import { alternates, pathFor, type Locale, type PageId } from '../i18n/routes';

export interface SeoInput {
  page: PageId;
  locale: Locale;
  title: string;
  description: string;
  site: URL | string;
}

export interface SeoTags {
  canonical: string;
  hreflang: { hreflang: string; href: string }[];
  ogLocale: string;
}

export function buildSeo({ page, locale, site }: SeoInput): SeoTags {
  const origin = new URL(site).origin;

  return {
    canonical: new URL(pathFor(page, locale), origin).href,
    hreflang: [
      ...alternates(page).map(({ locale: l, path }) => ({
        hreflang: l === 'de' ? 'de-CH' : 'en',
        href: new URL(path, origin).href,
      })),
      { hreflang: 'x-default', href: new URL(pathFor(page, 'de'), origin).href },
    ],
    ogLocale: locale === 'de' ? 'de_CH' : 'en_GB',
  };
}

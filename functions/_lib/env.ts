/**
 * Bindings und Variablen des Endpoints. Verzeichnisse und Dateien mit
 * `_`-Prefix werden von Cloudflare Pages nicht als Route veroeffentlicht —
 * hier liegt nur gemeinsamer Code.
 */
export interface Env {
  /** KV-Namespace fuer Rate-Limit, offene und bestaetigte Anmeldungen. */
  BIRKENHAIN_KV: KVNamespace;
  MAIL_PROVIDER?: string;
  MAIL_API_KEY?: string;
  MAIL_FROM?: string;
  MAIL_NOTIFY_TO?: string;
  OPT_IN_SECRET?: string;
  PUBLIC_SITE_ORIGIN?: string;
}

export type Locale = 'de' | 'en';

export function normalizeLocale(value: unknown): Locale {
  return value === 'en' ? 'en' : 'de';
}

/** Zielseiten des Endpoints. Echte Routen, damit es ohne JS funktioniert. */
const PATHS = {
  de: {
    sent: '/anmeldung/gesendet',
    confirmed: '/anmeldung/bestaetigt',
    confirmFailed: '/anmeldung/bestaetigung-fehlgeschlagen',
    error: '/anmeldung/fehler',
    rateLimit: '/anmeldung/zu-viele-versuche',
    form: '/anmeldung',
  },
  en: {
    sent: '/en/register/sent',
    confirmed: '/en/register/confirmed',
    confirmFailed: '/en/register/confirmation-failed',
    error: '/en/register/error',
    rateLimit: '/en/register/too-many-attempts',
    form: '/en/register',
  },
} as const;

export type StatusPath = keyof (typeof PATHS)['de'];

export function statusUrl(request: Request, env: Env, locale: Locale, kind: StatusPath): string {
  const origin = env.PUBLIC_SITE_ORIGIN ?? new URL(request.url).origin;
  return new URL(PATHS[locale][kind], origin).toString();
}

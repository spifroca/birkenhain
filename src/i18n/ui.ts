import de from './de.json';
import en from './en.json';
import { DEFAULT_LOCALE, type Locale } from './routes';

/** Das deutsche Dictionary ist die Referenz: EN muss dieselben Keys tragen. */
export type Dictionary = typeof de;

const DICTS: Record<Locale, Dictionary> = {
  de,
  // Fehlende EN-Keys fallen strukturell auf, weil der Typ aus DE stammt.
  en: en as Dictionary,
};

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Punktnotierter Key in das Dictionary, z. B. `nav.architektur`. */
export type TranslationKey = Leaves<Dictionary>;

function lookup(dict: Dictionary, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], dict);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Uebersetzer fuer eine Sprache. Platzhalter im Text werden als `{name}`
 * geschrieben und ueber `vars` gefuellt.
 */
export function useTranslations(locale: Locale) {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];

  return function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const raw = lookup(dict, key) ?? lookup(DICTS[DEFAULT_LOCALE], key);

    if (raw === undefined) {
      // Im Build sichtbar machen statt still einen leeren String ausliefern.
      if (import.meta.env.DEV) console.warn(`[i18n] fehlender Key: ${key} (${locale})`);
      return key;
    }

    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}

/** Feld aus einem Datensatz, der seine Sprachvarianten selbst mitbringt. */
export function pick<T>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale] ?? value[DEFAULT_LOCALE];
}

/** Zahl in der Konvention der jeweiligen Sprache. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-CH' : 'en-CH').format(value);
}

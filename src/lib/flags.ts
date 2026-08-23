/**
 * Feature-Flags. Alles hier ist absichtlich statisch: die Flags werden zur
 * Buildzeit ausgewertet, deaktivierte Bereiche landen nicht im Output.
 */
export const features = {
  /**
   * Wohnungsspiegel (Filtertabelle) auf /wohnungen.
   * Aus, bis echte Wohnungsdaten geliefert werden — die Daten im Prototyp
   * waren prozedural erzeugt. Einschalten heisst: `src/data/wohnungen.json`
   * füllen und diesen Wert auf `true` setzen.
   */
  wohnungsspiegel: false,

  /**
   * Freigabe für Suchmaschinen. Solange Platzhalter-Inhalte ausgeliefert
   * werden, steuert das robots.txt auf `Disallow: /` und setzt auf jeder
   * Seite `noindex`. Umschalten erst zum Launch, gemeinsam mit den echten
   * Inhalten.
   */
  indexable: false,

  /**
   * Statische Vorschau ohne PHP (GitHub Pages). Dort kann das Formular
   * nicht absenden — der Endpoint ist eine PHP-Datei, die auf einem
   * statischen Host nicht ausgefuehrt wird. Der Hinweis am Formular haengt
   * daran, damit niemand ins Leere klickt.
   *
   * Nur zur Buildzeit ausgewertet: `process.env`, weil flags.ts
   * ausschliesslich aus Frontmatter und Endpoints importiert wird.
   */
  staticPreview: process.env.STATIC_PREVIEW === 'true',
} as const;

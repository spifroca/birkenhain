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
} as const;

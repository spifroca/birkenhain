import raw from '../data/projekt.json';

export interface Projekt {
  name: string;
  gemeinde: string;
  kanton: string;
  /** Miete, kein Verkauf — im Datenfile festgehalten, nicht im Markup. */
  angebot: 'miete';
  wohnungen: number;
  baubereiche: number;
  vollgeschosse: { min: number; max: number };
  oberirdischAutofrei: boolean;
  /**
   * Publikationssperren. Beides ist bis auf Weiteres `false`: es werden
   * weder Mietpreise noch ein Vermietungsstart publiziert. Als Flag
   * abgebildet, damit eine Aenderung eine bewusste Entscheidung ist.
   */
  publikation: { mietpreise: boolean; vermietungsstart: boolean };
  koordinaten: { lat: number | null; lng: number | null; zoom: number };
}

export const projekt = raw as Projekt;

/** Karte nur rendern, wenn der Standort im Datenfile steht. */
export function hasCoordinates(
  p: Projekt = projekt,
): p is Projekt & { koordinaten: { lat: number; lng: number; zoom: number } } {
  return typeof p.koordinaten.lat === 'number' && typeof p.koordinaten.lng === 'number';
}

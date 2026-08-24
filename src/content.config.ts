import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/** Text, der in beiden Sprachen im Datensatz selbst steht. */
const localized = z.object({
  de: z.string(),
  en: z.string(),
});

/**
 * Baubereiche aus dem Gestaltungsplan.
 * `vollgeschosse` und `wohnungen` sind nullable, damit der Build nicht
 * bricht, solange die Zahlen fehlen — `npm run check:data` listet die Lücken.
 * Geschätzt wird nichts: der Wert kommt exakt aus dem Gestaltungsplan.
 */
const baubereiche = defineCollection({
  loader: file('src/data/baubereiche.json'),
  schema: z.object({
    label: z.string(),
    vollgeschosse: z.number().int().min(3).max(8).nullable(),
    wohnungen: z.number().int().positive().nullable(),
    /** Markerposition im Situationsplan, in Prozent der Planfläche. */
    plan: z.object({
      x: z.number().min(0).max(100).nullable(),
      y: z.number().min(0).max(100).nullable(),
    }),
    text: localized,
  }),
});

/**
 * Galerie. `src` wird von astro:assets zur Buildzeit optimiert.
 *
 * Die Daten aus dem Handoff liegen in `src/data/galerie.pending.json` und
 * warten auf die Bilder: `image()` loest den Pfad zur Buildzeit auf, ein
 * fehlendes Bild bricht den Build. Sobald die acht Dateien in `src/assets/`
 * liegen, `galerie.pending.json` nach `galerie.json` umbenennen — dann sind
 * Galerie, Lightbox und das Hero-Bild da.
 */
const galerie = defineCollection({
  loader: file('src/data/galerie.json'),
  schema: ({ image }) =>
    z.object({
      src: image(),
      alt: localized,
      caption: localized,
      /** Steuert die Reihenfolge in Galerie und Lightbox. */
      order: z.number().int().nonnegative().default(0),
      /** Genau ein Bild pro Seite darf hero sein: das laedt eager. */
      hero: z.boolean().default(false),
    }),
});

/** Distanztabelle auf /lage-mobilitaet. */
const distanzen = defineCollection({
  loader: file('src/data/distanzen.json'),
  schema: z.object({
    ziel: localized,
    /** Luftlinie bzw. Wegdistanz in Metern — Einheit gehoert in die View. */
    meter: z.number().int().positive().nullable(),
    minutenFuss: z.number().int().positive().nullable(),
    minutenOev: z.number().int().positive().nullable(),
    minutenAuto: z.number().int().positive().nullable(),
    kategorie: z.enum(['alltag', 'bildung', 'oev', 'freizeit', 'zentrum']),
    order: z.number().int().nonnegative().default(0),
  }),
});

/** Energiekonzept auf /nachhaltigkeit. */
const energie = defineCollection({
  loader: file('src/data/energie.json'),
  schema: z.object({
    thema: localized,
    kennwert: z.string().nullable(),
    einheit: z.string().nullable(),
    erlaeuterung: localized,
    icon: z.string().default('leaf'),
    order: z.number().int().nonnegative().default(0),
  }),
});

/**
 * Wohnungsspiegel. Bleibt leer, bis echte Projektdaten geliefert werden —
 * die Daten im Prototyp waren prozedural erzeugt. Die Komponente ist
 * gebaut, aber über `features.wohnungsspiegel` deaktiviert.
 * Kein Mietpreisfeld: Preise werden nicht publiziert.
 */
const wohnungen = defineCollection({
  loader: file('src/data/wohnungen.json'),
  schema: z.object({
    baubereich: z.string(),
    zimmer: z.number().positive(),
    geschoss: z.number().int(),
    flaecheM2: z.number().positive(),
    ausrichtung: localized,
    verfuegbar: z.boolean().default(true),
  }),
});

export const collections = { baubereiche, galerie, distanzen, energie, wohnungen };

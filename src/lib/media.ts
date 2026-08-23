import type { ImageMetadata } from 'astro';

/**
 * Ein Bild, wie Galerie und Lightbox es brauchen: bereits in der aktiven
 * Sprache aufgelöst, damit die Komponenten keine Locale mehr kennen müssen.
 *
 * Liegt hier und nicht im Frontmatter von Lightbox.astro: `.astro`-Dateien
 * exportieren nur ihre Default-Komponente, benannte Typen lassen sich
 * daraus nicht importieren.
 */
export interface LightboxImage {
  id: string;
  src: ImageMetadata;
  alt: string;
  caption: string;
}

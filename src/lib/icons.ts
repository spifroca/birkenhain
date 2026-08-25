import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Lucide-Icons aus dem Paket `lucide-static`, zur Buildzeit eingelesen und
 * inline ausgegeben: kein Icon-Font, kein Client-JS, kein Sprite-Request.
 * Stroke-Width wird projektweit auf 1.5 gesetzt (Lucide liefert 2).
 */
const ICON_DIR = join(process.cwd(), 'node_modules', 'lucide-static', 'icons');
const cache = new Map<string, string>();

export interface IconOptions {
  strokeWidth?: number;
  /** Auf `false` setzen, wenn das Icon die einzige Bedeutungsquelle ist. */
  decorative?: boolean;
  label?: string;
  class?: string;
}

export function lucide(name: string, options: IconOptions = {}): string {
  const { strokeWidth = 1.5, decorative = true, label, class: className } = options;
  const key = `${name}|${strokeWidth}|${decorative}|${label ?? ''}|${className ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const raw = read(name);
  if (raw === null) {
    throw new Error(
      `Lucide-Icon "${name}" nicht gefunden. Erwartet: node_modules/lucide-static/icons/${name}.svg`,
    );
  }

  const attrs = [
    `stroke-width="${strokeWidth}"`,
    'width="1em"',
    'height="1em"',
    'focusable="false"',
    decorative ? 'aria-hidden="true"' : `role="img" aria-label="${escapeAttr(label ?? name)}"`,
    `class="icon${className ? ` ${className}` : ''}"`,
  ].join(' ');

  // Kein `^`-Anker: lucide-static stellt jeder Datei einen Lizenzkommentar
  // voran (`<!-- @license lucide-static … -->`), der String beginnt also nicht
  // mit `<svg`. Mit dem Anker griff die Ersetzung nie — die Originalattribute
  // waren durch die Zeile darueber schon entfernt, die neuen kamen nicht dazu.
  // Ergebnis: SVG ohne width/height, also 0x0 Pixel, und stroke-width zurueck
  // auf Lucides Vorgabe statt der projektweiten 1.5. Alle 62 Icons der Site
  // waren unsichtbar, im DOM vorhanden und korrekt gefaerbt. Ein Fehler, den
  // man im HTML nicht sieht: dort steht ein vollstaendiges SVG.
  const svg = raw
    .replace(/\s(?:width|height|stroke-width|class|aria-hidden|role|aria-label)="[^"]*"/g, '')
    .replace(/<svg\b/, `<svg ${attrs}`)
    .trim();

  cache.set(key, svg);
  return svg;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Lucide hat einige Icons umbenannt und fuehrt die alten Namen als Alias.
 * Beide Schreibweisen werden probiert, damit ein Paket-Update den Build nicht
 * an einem Icon-Namen scheitern laesst.
 */
const ALIASES: Record<string, string> = {
  'triangle-alert': 'alert-triangle',
  'alert-triangle': 'triangle-alert',
  'circle-alert': 'alert-circle',
  'alert-circle': 'circle-alert',
  'rotate-ccw': 'rotate-left',
};

function read(name: string): string | null {
  for (const candidate of [name, ALIASES[name]]) {
    if (!candidate) continue;
    try {
      return readFileSync(join(ICON_DIR, `${candidate}.svg`), 'utf8');
    } catch {
      // naechster Kandidat
    }
  }
  return null;
}

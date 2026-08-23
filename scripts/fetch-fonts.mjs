/**
 * Holt Readex Pro als woff2 nach public/fonts/ — nur die Schnitte
 * 200/300/400/500/600/700, nur der Latin-Subset.
 *
 * Einmalig ausfuehren (`npm run fonts`); die Dateien sind per .gitignore aus
 * dem Repo ausgenommen, damit keine Binaries mitwandern. Fuer Deployments,
 * die keinen Netzzugriff im Build haben, die Dateien einmal committen und
 * die .gitignore-Zeile entfernen.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const WEIGHTS = [200, 300, 400, 500, 600, 700];
const OUT_DIR = join(process.cwd(), 'public', 'fonts');
const CSS_URL = `https://fonts.googleapis.com/css2?family=Readex+Pro:wght@${WEIGHTS.join(';')}&display=swap`;

// Ohne modernen User-Agent liefert Google ttf statt woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const response = await fetch(CSS_URL, { headers: { 'user-agent': UA } });
  if (!response.ok) {
    throw new Error(`Google Fonts antwortete mit ${response.status}`);
  }
  const css = await response.text();

  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  if (blocks.length === 0) throw new Error('Keine @font-face-Regeln in der Antwort gefunden.');

  const seen = new Set();
  let written = 0;

  for (const block of blocks) {
    // Nur der Latin-Subset; die uebrigen Subsets braucht das Projekt nicht.
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1] ?? '';
    if (range && !range.includes('U+0000-00FF')) continue;

    const weight = block.match(/font-weight:\s*([^;]+);/)?.[1]?.trim() ?? '';
    const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) continue;

    if (weight.includes(' ')) {
      console.warn(
        `Variabler Schnitt gefunden (font-weight: ${weight}). ` +
          'In src/styles/fonts.css auf eine Variable-Font-Regel umstellen.',
      );
    }

    const name = weight.includes(' ') ? 'variable' : weight;
    const file = `readex-pro-${name}.woff2`;
    if (seen.has(file)) continue;
    seen.add(file);

    const font = await fetch(url, { headers: { 'user-agent': UA } });
    if (!font.ok) throw new Error(`${file}: HTTP ${font.status}`);

    await writeFile(join(OUT_DIR, file), Buffer.from(await font.arrayBuffer()));
    console.log(`${file} (${weight})`);
    written += 1;
  }

  if (written === 0) throw new Error('Keine Schnitte geschrieben.');

  const missing = WEIGHTS.filter((weight) => !seen.has(`readex-pro-${weight}.woff2`));
  if (missing.length > 0 && !seen.has('readex-pro-variable.woff2')) {
    console.warn(`Fehlende Schnitte: ${missing.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

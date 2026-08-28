/**
 * Prueft, ob die gebauten Seiten zu ihrer eigenen Content-Security-Policy
 * passen.
 *
 * Der Anlass: die `.htaccess` setzt `script-src 'self'` — ohne
 * `unsafe-inline`, ohne Nonce, ohne Hash. Astro buendelte die fuenf kleinen
 * Skripte (Burger-Menue, Situationsplan, Sticky-Bar, Scroll-Reveal,
 * Hero-Film) trotzdem in das HTML. Der Browser weist Inline-Skripte unter
 * dieser Regel ab, und zwar still: die Seite rendert vollstaendig, nur
 * reagiert nichts von ihr. Gemessen am 28.08.2026 mit der echten CSP —
 * «Refused to execute inline script», der Baubereich-Marker blieb auf
 * `aria-pressed=false`. Jede bisherige Pruefung war gruen, weil sie ohne
 * diesen Header servierte.
 *
 * Aufruf: node scripts/check-csp.mjs [verzeichnis]   (Standard: dist)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const WURZEL = process.argv[2] ?? 'dist';
const problems = [];

/** Die Policy steht in der `.htaccess`, die mit in den Build kopiert wird. */
function lesePolicy(verzeichnis) {
  const pfad = join(verzeichnis, '.htaccess');
  if (!existsSync(pfad)) return null;
  for (const zeile of readFileSync(pfad, 'utf8').split('\n')) {
    if (!/Content-Security-Policy/i.test(zeile)) continue;
    const treffer = zeile.match(/"([^"]*)"/);
    if (treffer) return treffer[1];
  }
  return null;
}

function seiten(verzeichnis) {
  const gefunden = [];
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    const pfad = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) gefunden.push(...seiten(pfad));
    else if (extname(eintrag.name) === '.html') gefunden.push(pfad);
  }
  return gefunden;
}

const policy = lesePolicy(WURZEL);
if (policy === null) {
  console.error(
    `::error title=Keine CSP im Build::${join(WURZEL, '.htaccess')} fehlt oder enthaelt keine ` +
      `Content-Security-Policy. Ohne sie ist diese Pruefung wertlos — und die Site ohne Schutz.`,
  );
  process.exit(1);
}

const scriptSrc = (policy.match(/script-src ([^;]*)/) ?? [])[1]?.trim() ?? '';
if (scriptSrc === '') {
  console.error(
    '::error title=script-src fehlt in der CSP::Ohne eigene script-src-Direktive greift default-src. ' +
      'Diese Pruefung kann dann nicht entscheiden, was erlaubt ist.',
  );
  process.exit(1);
}
const inlineErlaubt = /'unsafe-inline'|sha256-|sha384-|sha512-|nonce-/.test(scriptSrc);

let alsDatei = 0;
let inline = 0;
const betroffen = [];

for (const seite of seiten(WURZEL)) {
  const html = readFileSync(seite, 'utf8');
  // JSON-LD ist kein ausfuehrbares Skript und faellt nicht unter script-src.
  for (const treffer of html.matchAll(/<script(?![^>]*application\/ld\+json)([^>]*)>/g)) {
    if (/\bsrc=/.test(treffer[1])) alsDatei++;
    else {
      inline++;
      if (!betroffen.includes(seite)) betroffen.push(seite);
    }
  }
}

console.log(`script-src: ${scriptSrc}`);
console.log(`Skripte: ${alsDatei} als Datei, ${inline} inline`);

if (inline > 0 && !inlineErlaubt) {
  problems.push(
    `${inline} Inline-Skript(e) in ${betroffen.length} von ${seiten(WURZEL).length} Seiten, ` +
      `aber script-src erlaubt kein Inline. Der Browser fuehrt sie nicht aus — ` +
      `still, die Seite rendert trotzdem. Betroffen u.a.: ${betroffen.slice(0, 3).join(', ')}`,
  );
}

if (alsDatei === 0 && inline === 0) {
  problems.push(
    'Kein einziges Skript im Build gefunden. Entweder ist das HTML leer, oder diese ' +
      'Pruefung greift ins Nichts — beides ist ein Befund.',
  );
}

if (problems.length > 0) {
  for (const p of problems) console.error(`::error title=CSP und Build passen nicht zusammen::${p}`);
  process.exit(1);
}

console.log('CSP und Build passen zusammen.');

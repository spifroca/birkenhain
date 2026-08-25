/**
 * Prueft die Zusagen, die man nur im echten Browser sehen kann.
 *
 * `curl` liefert den HTML-Text, so wie der Server ihn ausliefert. Was der
 * Browser daraus macht, steht dort nicht: welche CSS-Regel gegen welche
 * gewinnt, ob Escape den Dialog schliesst, wohin der Fokus danach geht.
 * Genau das prueft diese Datei.
 *
 * Aufruf:
 *   node scripts/browser-check.mjs [verzeichnis]
 *
 * Ohne Argument wird `dist` geprueft, also das Ergebnis von `npm run build`.
 * Jedes andere Verzeichnis mit einer gebauten Site geht auch — etwa ein
 * Auszug des deploy-Branches:
 *   git archive origin/deploy | tar -x -C /tmp/site
 *   node scripts/browser-check.mjs /tmp/site
 *
 * Zwei Eigenheiten dieser Umgebung, beide hier schon beruecksichtigt:
 *
 * 1. Chromium kommt nicht nach draussen. Ein Aufruf von birkenhain.ch endet
 *    in ERR_CONNECTION_RESET, mit Proxy wie ohne. Darum wird das gebaute
 *    Verzeichnis lokal serviert und der Browser bleibt auf 127.0.0.1.
 * 2. Playwright liegt global unter /opt/node22/lib/node_modules und wird von
 *    einem ESM-Import in diesem Projekt nicht gefunden — NODE_PATH gilt nur
 *    fuer `require`. Der Resolver unten sucht deshalb beide Orte ab.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const WURZEL = resolve(process.argv[2] ?? 'dist');

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/**
 * Playwright kommt aus dem Projekt oder aus der globalen Installation.
 *
 * Der globale Pfad zeigt auf CommonJS: ein `import()` darauf legt alles unter
 * `default`, waehrend das Paket im Projekt `chromium` direkt benannt
 * exportiert. Beide Formen werden hier auf dieselbe zurueckgefuehrt — sonst
 * ist `chromium` undefined und der Fehler zeigt auf die falsche Zeile.
 */
async function ladePlaywright() {
  const orte = ['playwright', '/opt/node22/lib/node_modules/playwright/index.js'];
  for (const ort of orte) {
    try {
      const mod = await import(ort);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return { chromium };
    } catch {
      /* naechster Ort */
    }
  }
  console.error(
    'Playwright ist nicht auffindbar.\n' +
      'Geprueft: ' +
      orte.join(', ') +
      '\nInstallieren mit `npm i -D playwright`, oder den globalen Pfad anpassen.',
  );
  process.exit(1);
}

/**
 * Statischer Server ueber dem gebauten Verzeichnis. Bewusst schmal: er muss
 * nur so viel koennen, wie die Site zum Rendern braucht — Verzeichnisse auf
 * index.html abbilden, Dateien mit dem richtigen Typ ausliefern, und Pfade
 * ausserhalb der Wurzel abweisen.
 */
function starteServer(wurzel) {
  const server = createServer((req, res) => {
    const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let datei = resolve(join(wurzel, pfad));
    if (datei !== wurzel && !datei.startsWith(wurzel + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(datei) && statSync(datei).isDirectory()) {
      datei = join(datei, 'index.html');
    }
    if (!existsSync(datei)) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
      return;
    }
    res.writeHead(200, { 'content-type': TYPEN[extname(datei)] ?? 'application/octet-stream' });
    createReadStream(datei).pipe(res);
  });

  return new Promise((ok) => {
    server.listen(0, '127.0.0.1', () => ok({ server, port: server.address().port }));
  });
}

const ergebnisse = [];
function pruefe(name, bestanden, detail = '') {
  ergebnisse.push({ name, bestanden, detail });
  const zeichen = bestanden ? 'ok  ' : 'FEHL';
  console.log(`  ${zeichen}  ${name}${detail ? ' — ' + detail : ''}`);
}

if (!existsSync(WURZEL)) {
  console.error(`Verzeichnis fehlt: ${WURZEL}\nErst \`npm run build\`, oder ein Verzeichnis angeben.`);
  process.exit(1);
}

const { chromium } = await ladePlaywright();
const { server, port } = await starteServer(WURZEL);
const basis = `http://127.0.0.1:${port}`;

// --no-sandbox: der Lauf passiert als root im Container, ohne User-Namespaces.
const browser = await chromium.launch({ args: ['--no-sandbox'] });

try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const p = await ctx.newPage();

  // --- Situationsplan: Baubereiche per Tastatur ---------------------------
  console.log('\nSituationsplan');
  await p.goto(`${basis}/architektur/`, { waitUntil: 'load' });

  const marker = p.locator('.marker');
  const anzahl = await marker.count();
  pruefe('17 Baubereich-Marker', anzahl === 17, `${anzahl} gefunden`);

  const erster = marker.first();
  await erster.focus();
  pruefe(
    'Marker per Tastatur fokussierbar',
    await erster.evaluate((el) => el === document.activeElement),
  );

  await p.keyboard.press('Enter');
  await p.waitForTimeout(150);
  pruefe('Enter setzt aria-pressed', (await erster.getAttribute('aria-pressed')) === 'true');

  const offen = await p.locator('.panel__card:not([hidden])').count();
  pruefe('genau eine Detailkarte sichtbar', offen === 1, `${offen} sichtbar`);

  // --- Detailkarte: eine Flaeche, nicht zwei -----------------------------
  // Regressionswaechter. `.section--alt .row` in design.css faerbte die
  // Zeilen auf die Abschnittsfarbe, waehrend das Panel heller stand: zwei
  // Toene in einem Feld. Kommt das zurueck, faellt dieser Test.
  const toene = await p.evaluate(() => {
    const karte = document.querySelector('.panel__card:not([hidden])');
    const panel = getComputedStyle(document.querySelector('.panel')).backgroundColor;
    const zeilen = [...karte.querySelectorAll('.row')].map(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const sichtbar = zeilen.filter((f) => f !== 'rgba(0, 0, 0, 0)' && f !== 'transparent');
    return { panel, abweichend: [...new Set(sichtbar.filter((f) => f !== panel))] };
  });
  pruefe(
    'Detailkarte ist eine Flaeche',
    toene.abweichend.length === 0,
    toene.abweichend.length ? `Zeilen in ${toene.abweichend.join(', ')} statt ${toene.panel}` : toene.panel,
  );

  const labelFarben = await p.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('.panel__card:not([hidden]) .row__label')].map(
        (el) => getComputedStyle(el).color,
      ),
    ),
  ]);
  pruefe('Zeilenbeschriftungen einfarbig', labelFarben.length === 1, labelFarben.join(', '));

  // --- Sprachumschalter: nicht nur Farbe --------------------------------
  console.log('\nSprachumschalter');
  for (const [seite, aktiv] of [
    ['/', 'DE'],
    ['/en/', 'EN'],
  ]) {
    await p.goto(`${basis}${seite}`, { waitUntil: 'load' });
    const items = await p.locator('.lang__item').count();
    const markiert = (await p.locator('.lang__item[aria-current="true"]').textContent()) ?? '';
    pruefe(
      `${seite} zeigt beide Sprachen, aktive maschinenlesbar`,
      items === 2 && markiert.trim() === aktiv,
      `${items} Items, aria-current: ${markiert.trim()}`,
    );
  }

  // --- Lightbox: Escape und Fokusrueckgabe ------------------------------
  console.log('\nLightbox');
  await p.goto(`${basis}/`, { waitUntil: 'load' });
  const trigger = p.locator('button[aria-label^="Bild vergr"]').first();
  if ((await trigger.count()) === 0) {
    pruefe('Galerie-Trigger vorhanden', false, 'keiner gefunden');
  } else {
    await trigger.click();
    await p.waitForTimeout(250);
    pruefe('Klick oeffnet den Dialog', (await p.locator('dialog[open]').count()) === 1);

    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
    pruefe('Escape schliesst den Dialog', (await p.locator('dialog[open]').count()) === 0);
    pruefe(
      'Fokus kehrt zum Trigger zurueck',
      await trigger.evaluate((el) => el === document.activeElement),
    );
  }

  // --- Suchmaschinen-Sperre --------------------------------------------
  // Zwei Haelften, getrennt geprueft: das Vorschau-Band haengt an einem
  // anderen Schalter als die Sperre. Ein fehlendes Band heisst nicht, dass
  // die Site freigegeben ist.
  console.log('\nSuchmaschinen-Sperre');
  const robots = await readFile(join(WURZEL, 'robots.txt'), 'utf8').catch(() => '');
  pruefe('robots.txt sperrt alles', /^\s*Disallow:\s*\/\s*$/m.test(robots));

  for (const seite of ['/', '/architektur/', '/en/', '/impressum/']) {
    await p.goto(`${basis}${seite}`, { waitUntil: 'load' });
    const wert = await p
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
      .catch(() => null);
    pruefe(`noindex auf ${seite}`, (wert ?? '').includes('noindex'), wert ?? 'kein Tag');
  }
} finally {
  await browser.close();
  server.close();
}

const durchgefallen = ergebnisse.filter((e) => !e.bestanden);
console.log(
  `\n${ergebnisse.length - durchgefallen.length} von ${ergebnisse.length} Pruefungen bestanden.`,
);
if (durchgefallen.length) {
  console.error(`\n${durchgefallen.length} fehlgeschlagen:`);
  for (const e of durchgefallen) console.error(`  - ${e.name}${e.detail ? ': ' + e.detail : ''}`);
  process.exit(1);
}

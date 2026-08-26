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

  // --- Icons: im DOM ist nicht dasselbe wie sichtbar ---------------------
  // Alle 62 Icons der Site waren einmal 0x0 Pixel gross: lucide-static stellt
  // jeder Datei einen Lizenzkommentar voran, deshalb griff der `^<svg`-Anker
  // im Helfer nicht, die Originalmasse waren aber schon entfernt. Im HTML
  // stand ein vollstaendiges, korrekt gefaerbtes SVG — zu sehen war nichts.
  // Darum wird hier die gerenderte Groesse gemessen, nicht die Existenz.
  console.log('\nIcons');
  // Auf die Startseite wechseln: /architektur/ traegt kein einziges Icon im
  // Markup, nur die CSS-Regel dazu. Ein Zaehler, der die Regel mitzaehlt,
  // meldet Icons, wo keine sind.
  await p.goto(`${basis}/`, { waitUntil: 'load' });
  const icons = await p.evaluate(() => {
    // Bewusst ueber `.icon-wrap svg` statt `svg.icon`: die Klasse `icon` setzt
    // derselbe Helfer, der die Masse setzt. Fehlt sie, findet ein
    // Klassenselektor null Icons und meldet «keine da» statt «alle 0x0» — die
    // Pruefung waere richtig rot, aber aus dem falschen Grund.
    //
    // Nur gerenderte Icons zaehlen. Was in einem geschlossenen <dialog> oder
    // unter einem [hidden] liegt, hat null Groesse — korrektes Verhalten des
    // Browsers, kein Defekt. Die erste Fassung mass alles und meldete deshalb
    // die drei Lightbox-Knoepfe als kaputt, obwohl der Dialog nur zu war.
    // Ein Waechter, der richtiges Verhalten anzeigt, kostet Vertrauen.
    const gerendert = (el) =>
      !el.closest('dialog:not([open])') && !el.closest('[hidden]') && el.checkVisibility?.() !== false;

    const alle = [...document.querySelectorAll('.icon-wrap svg')];
    const sichtbar = alle.filter(gerendert);
    const winzig = [];
    const strichbreiten = new Set();
    for (const svg of sichtbar) {
      const box = svg.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) {
        winzig.push(`${Math.round(box.width)}x${Math.round(box.height)}`);
      }
      strichbreiten.add(getComputedStyle(svg).strokeWidth);
    }
    return {
      anzahl: sichtbar.length,
      verborgen: alle.length - sichtbar.length,
      winzig,
      strichbreiten: [...strichbreiten],
    };
  });  pruefe(
    'Icons vorhanden',
    icons.anzahl > 0,
    `${icons.anzahl} gerendert` + (icons.verborgen ? `, ${icons.verborgen} verborgen (Dialog zu)` : ''),
  );
  pruefe(
    'Icons haben eine Groesse',
    icons.winzig.length === 0,
    icons.winzig.length ? `${icons.winzig.length} unter 8px: ${[...new Set(icons.winzig)].join(', ')}` : 'alle >= 8px',
  );
  pruefe(
    'Strichbreite 1.5',
    icons.strichbreiten.every((b) => b === '1.5px'),
    icons.strichbreiten.join(', ') || 'keine gemessen',
  );

  // Die Lightbox-Knoepfe sind der Ort, an dem unsichtbare Icons wirklich
  // wehtun: ein Schliessen-Knopf, den man nicht sieht. Uebersprungen werden
  // sie oben nur, WEIL der Dialog zu ist — also einmal aufmachen und dann
  // messen. Sonst waere die Ausnahme eine Luecke.
  const lbTrigger = p.locator('button[aria-label^="Bild vergr"]').first();
  if ((await lbTrigger.count()) > 0) {
    await lbTrigger.click();
    await p.waitForTimeout(250);
    const lb = await p.evaluate(() => {
      const d = document.querySelector('dialog[open]');
      if (!d) return null;
      const svgs = [...d.querySelectorAll('.icon-wrap svg')];
      return {
        anzahl: svgs.length,
        winzig: svgs
          .map((s) => s.getBoundingClientRect())
          .filter((b) => b.width < 8 || b.height < 8)
          .map((b) => `${Math.round(b.width)}x${Math.round(b.height)}`),
      };
    });
    pruefe(
      'Icons der offenen Lightbox haben eine Groesse',
      lb !== null && lb.anzahl > 0 && lb.winzig.length === 0,
      lb === null ? 'Dialog nicht offen' : `${lb.anzahl} Icons, ${lb.winzig.length} zu klein`,
    );
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
  }

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

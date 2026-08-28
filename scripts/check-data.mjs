/**
 * Prueft die Datenfiles auf Luecken und auf die nicht verhandelbaren
 * Projektfakten. Laeuft nicht im Build mit: unvollstaendige Daten sollen
 * sichtbar sein, aber die Entwicklung nicht blockieren.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'src', 'data');

async function load(name) {
  return JSON.parse(await readFile(join(DATA, name), 'utf8'));
}

const problems = [];
const notes = [];

function problem(message) {
  problems.push(message);
}

function note(message) {
  notes.push(message);
}

const projekt = await load('projekt.json');
const baubereiche = await load('baubereiche.json');
const galerie = await load('galerie.json');
const distanzen = await load('distanzen.json');
const energie = await load('energie.json');
const wohnungen = await load('wohnungen.json');

// --- Projektfakten: fest zugesagt, hier gegen Abdriften gesichert ----------
if (projekt.wohnungen !== 300) problem(`projekt.wohnungen ist ${projekt.wohnungen}, erwartet 300`);
if (projekt.baubereiche !== 17)
  problem(`projekt.baubereiche ist ${projekt.baubereiche}, erwartet 17`);
if (projekt.vollgeschosse?.min !== 3 || projekt.vollgeschosse?.max !== 8) {
  problem('projekt.vollgeschosse muss 3 bis 8 sein');
}
if (projekt.oberirdischAutofrei !== true) problem('projekt.oberirdischAutofrei muss true sein');
if (projekt.angebot !== 'miete') problem("projekt.angebot muss 'miete' sein");
if (projekt.publikation?.mietpreise !== false) {
  problem('projekt.publikation.mietpreise muss false bleiben: keine Mietpreise publizieren');
}
if (projekt.publikation?.vermietungsstart !== false) {
  problem('projekt.publikation.vermietungsstart muss false bleiben: kein Vermietungsstart');
}
if (projekt.koordinaten?.lat === null || projekt.koordinaten?.lng === null) {
  note('projekt.koordinaten: lat/lng fehlen — die Karte bleibt ausgeblendet');
}

// --- Baubereiche ----------------------------------------------------------
if (baubereiche.length !== 17) {
  problem(`baubereiche.json hat ${baubereiche.length} Einträge, erwartet 17`);
}

const floorsMissing = baubereiche.filter((area) => area.vollgeschosse === null).map((a) => a.label);
if (floorsMissing.length > 0) {
  note(`Vollgeschosse fehlen (aus Gestaltungsplan übernehmen): ${floorsMissing.join(', ')}`);
}

for (const area of baubereiche) {
  if (area.vollgeschosse !== null && (area.vollgeschosse < 3 || area.vollgeschosse > 8)) {
    problem(`Baubereich ${area.label}: ${area.vollgeschosse} Vollgeschosse liegt ausserhalb 3–8`);
  }
}

/**
 * Zehn der siebzehn Kurztexte nennen die Geschosszahl im Wort
 * («achtgeschossiger Solitaer», «five-storey row»). Damit haengt der Text an
 * einer Zahl, die woanders steht — und beim naechsten Korrigieren der Zahl
 * bleibt der Text stumm falsch stehen. Genau das lag heute nahe: Baubereich
 * 17 wurde nach der Grundmasse-Tabelle von 4 auf 5 Vollgeschosse korrigiert.
 *
 * Geprueft wird nur, wo der Text ueberhaupt eine Zahl nennt. Texte ohne
 * Geschossangabe sind in Ordnung; sie sagen nichts, was falsch werden kann.
 */
const ZAHLWORT_DE = {
  1: 'einge',
  2: 'zweige',
  3: 'dreige',
  4: 'vierge',
  5: 'fünfge',
  6: 'sechsge',
  7: 'siebenge',
  8: 'achtge',
};
const ZAHLWORT_EN = {
  1: 'one-storey',
  2: 'two-storey',
  3: 'three-storey',
  4: 'four-storey',
  5: 'five-storey',
  6: 'six-storey',
  7: 'seven-storey',
  8: 'eight-storey',
};

function genanntZahl(text, woerter) {
  const klein = String(text ?? '').toLowerCase();
  const treffer = Object.entries(woerter).find(([, wort]) => klein.includes(wort));
  return treffer ? Number(treffer[0]) : null;
}

for (const area of baubereiche) {
  if (area.vollgeschosse === null) continue;
  for (const [sprache, woerter] of [
    ['de', ZAHLWORT_DE],
    ['en', ZAHLWORT_EN],
  ]) {
    const genannt = genanntZahl(area.text?.[sprache], woerter);
    if (genannt !== null && genannt !== area.vollgeschosse) {
      problem(
        `Baubereich ${area.label}: Text (${sprache}) nennt ${genannt} Geschosse, ` +
          `die Daten ${area.vollgeschosse}`,
      );
    }
  }
}

const unitsKnown = baubereiche.filter((area) => area.wohnungen !== null);
if (unitsKnown.length === baubereiche.length) {
  const sum = unitsKnown.reduce((total, area) => total + area.wohnungen, 0);
  if (sum !== projekt.wohnungen) {
    problem(`Summe der Wohnungen je Baubereich ist ${sum}, erwartet ${projekt.wohnungen}`);
  }
} else if (unitsKnown.length > 0) {
  note(
    `Wohnungszahlen erst für ${unitsKnown.length} von ${baubereiche.length} Baubereichen erfasst`,
  );
} else {
  // Der Fall «keine einzige erfasst» war vorher stumm: die Bedingung oben
  // greift erst ab einer Zahl. Eine Luecke, die nichts sagt, sieht aus wie
  // eine Pruefung, die nichts findet.
  note(
    `Wohnungszahlen je Baubereich sind alle offen — die Detailkarten zeigen «—». ` +
      `Die frueheren 17 Werte summierten auf 278 und passen nicht mehr zu ${projekt.wohnungen}.`,
  );
}

const markerless = baubereiche.filter((area) => area.plan?.x === null || area.plan?.y === null);
if (markerless.length > 0) {
  note(
    `Markerpositionen fehlen für ${markerless.length} Baubereiche — Situationsplan zeigt nur die Liste`,
  );
}

// --- Uebrige Datenfiles --------------------------------------------------
if (galerie.length === 0) note('galerie.json ist leer — Galerie und Lightbox bleiben ausgeblendet');
if (distanzen.length === 0) note('distanzen.json ist leer — Distanztabelle bleibt ausgeblendet');
if (energie.length === 0) note('energie.json ist leer — Energiekonzept bleibt ausgeblendet');
if (wohnungen.length === 0) {
  note('wohnungen.json ist leer — Wohnungsspiegel bleibt deaktiviert (so vorgesehen)');
}

// --- Ausgabe -------------------------------------------------------------
for (const message of notes) console.log(`offen    ${message}`);
for (const message of problems) console.error(`FEHLER   ${message}`);

console.log(`\n${problems.length} Fehler, ${notes.length} offene Punkte`);
process.exit(problems.length > 0 ? 1 : 0);

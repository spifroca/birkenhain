# Prüfen im echten Browser

`curl` liefert den HTML-Text, so wie der Server ihn ausliefert. Was der
Browser daraus **macht**, steht dort nicht: welche CSS-Regel gegen welche
gewinnt, ob Escape den Dialog schliesst, wohin der Fokus danach geht. Genau
das prüft `scripts/browser-check.mjs`, gesteuert über Playwright.

```bash
npm run build          # erzeugt dist/
npm run check:browser  # prüft dist/
```

Ohne eigenen Build geht auch der aufgeschaltete Stand aus dem Deploy-Branch:

```bash
git archive origin/deploy | tar -x -C /tmp/site
node scripts/browser-check.mjs /tmp/site
```

## Was geprüft wird

| Bereich | Zusage |
| --- | --- |
| Situationsplan | 17 Marker, per Tastatur fokussierbar, Enter setzt `aria-pressed`, genau eine Detailkarte sichtbar |
| Detailkarte | **eine** Hintergrundfarbe, Zeilenbeschriftungen einfarbig |
| Sprachumschalter | beide Sprachen vorhanden, die aktive mit `aria-current` — nicht nur farblich |
| Lightbox | öffnet auf Klick, schliesst auf Escape, Fokus kehrt zum Auslöser zurück |
| Suchmaschinen-Sperre | `Disallow: /` in `robots.txt` **und** `noindex` auf DE-, EN- und Rechtstextseiten |

Die letzten zwei Punkte sind bewusst getrennt geprüft. Das Vorschau-Band
hängt an `features.previewNotice`, die Sperre allein an `features.indexable` —
ein fehlendes Band heisst nicht, dass die Site freigegeben ist.

Der Punkt «Detailkarte ist eine Fläche» ist ein Regressionswächter. Die Karte
hatte zwei Töne, weil `.section--alt .row` in `design.css` die Zeilen auf die
Abschnittsfarbe setzte, während das Panel heller stand. Kommt das zurück,
fällt der Test — mit den gemessenen Farbwerten im Klartext.

## Zwei Eigenheiten dieser Umgebung

**Chromium kommt nicht nach draussen.** Ein Aufruf von `birkenhain.ch` endet
in `ERR_CONNECTION_RESET`, mit Proxy wie ohne. Deshalb serviert das Skript das
gebaute Verzeichnis selbst auf `127.0.0.1` und bleibt dort. Für Prüfungen
gegen die öffentliche Adresse bleibt `curl` das Mittel — der Proxy trägt es.

**Playwright liegt global**, unter `/opt/node22/lib/node_modules/playwright`,
Version 1.56.1, mit passender Chromium-Revision in `/opt/pw-browsers`. Ein
ESM-`import 'playwright'` findet das nicht: `NODE_PATH` gilt nur für
`require`. Das Skript sucht deshalb beide Orte ab und führt die
CommonJS-Form (`default.chromium`) und die ESM-Form (`chromium`) zusammen.
Die npm-Registry ist in dieser Umgebung gesperrt — auch für `ms` —, ein
`npm i playwright` scheitert also mit 403. Nötig ist es nicht.

## In die CI aufnehmen

Dort ist `dist/` ohnehin vorhanden, es fehlt nur das Paket:

```yaml
- name: Playwright
  run: npm i -D playwright && npx playwright install --with-deps chromium

- name: Verhalten im Browser
  run: npm run check:browser
```

Bewusst nicht schon eingebaut: der Schritt lädt einen Browser herunter und
verlängert jeden Lauf um Minuten. Ob das jeden Push kosten soll oder nur den
Weg vor einem Release, ist eine Projektentscheidung.

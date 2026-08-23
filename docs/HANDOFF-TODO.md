# Offene Punkte aus dem Design-Handoff

Das Bundle `design_handoff_im_birkenhain/` lag in der Session, in der dieses
Repo aufgesetzt wurde, nicht vor — nur der Startprompt. Alles, was von den
exakten Werten der Spezifikation abhängt, ist deshalb als
`TODO(handoff)` markiert und an einer Stelle gebündelt, statt geschätzt zu
werden. `npm run check:data` listet die Datenlücken jederzeit auf.

## Erwartete Build-Meldungen

Solange die Datenfiles leer sind, schreibt Astro pro betroffener Seite:

```
The collection "galerie" does not exist or is empty.
Please check your content config file for errors.
```

Die Config ist in Ordnung. Astro behandelt eine leere `file()`-Collection wie
eine fehlende und formuliert es irreführend. Betroffen sind `galerie`,
`distanzen`, `energie` und `wohnungen`; die Meldungen verschwinden, sobald die
Dateien Inhalt haben. Der Build ist davon nicht betroffen — er läuft grün
durch. Nicht nach einem Config-Fehler suchen.

Übernommen sind die Fakten, die im Startprompt selbst stehen: 278
Mietwohnungen, 17 Baubereiche, 3–8 Vollgeschosse, oberirdisch autofrei, Miete
statt Verkauf, keine Mietpreise, kein Vermietungsstart. Sie liegen in
`src/data/projekt.json` und werden von `scripts/check-data.mjs` gegen
Abdriften gesichert.

## 1. Design-Tokens — `src/styles/tokens.css`

Die Datei trägt den vollständigen Tokensatz mit **provisorischen** Werten.
Zu ersetzen aus `README.md` (Abschnitt Design-Tokens / Typografie) und den
Inline-Styles in `design/Im Birkenhain.dc.html`:

- Farben: `--c-bg`, `--c-bg-alt`, `--c-bg-inverse`, `--c-text`,
  `--c-text-muted`, `--c-accent`, `--c-accent-hover`, `--c-hairline`
- Typo-Skala: `--fs-display` bis `--fs-caption`, Zeilenhöhen, Laufweiten
- Raster: `--container`, `--container-text`, `--gutter`, `--space-*`
- Shell-Masse: `--header-h`, `--stickybar-h`

Gesetzt und nicht zu ändern: `--radius: 0`, `--shadow: none`,
`--border-width: 1px`, `--focus-width: 2px`, `--icon-stroke: 1.5`.

Nirgends im Code steht ein Farb- oder Grössenliteral: das Ersetzen dieser
Datei genügt.

## 2. Copy DE/EN — `src/i18n/de.json`, `src/i18n/en.json`

Die UI-Texte (Navigation, Formular, Fehlermeldungen, Tabellenköpfe,
Karten-Consent, A11y-Labels) sind vollständig in beiden Sprachen gesetzt.
Offen sind die Projekttexte, alle mit `TODO(handoff):` als Wert:

- `home.metaDescription`, `home.heroTitle`, `home.heroLead`
- je Screen `metaDescription` und `lead`:
  `architektur`, `freiraum`, `lage`, `nachhaltigkeit`, `wohnungen`
- `footer` — Kontaktangaben stehen als Platzhalter direkt in
  `src/components/SiteFooter.astro`

Beide Dictionaries tragen denselben Keysatz (158 Keys); die EN-Datei muss
das bleiben, sonst greift der Fallback auf DE.

## 3. Baubereiche — `src/data/baubereiche.json`

17 Einträge liegen vor, die Werte fehlen:

- `vollgeschosse` — exakt aus dem Gestaltungsplan, nicht geschätzt.
  Der Schema-Check erlaubt nur 3–8.
- `label` — aktuell `"1"` … `"17"`. Falls der Gestaltungsplan Buchstaben
  oder eine andere Bezeichnung verwendet, hier ersetzen.
- `wohnungen` — Wohnungen je Baubereich. Sind alle 17 gesetzt, prüft
  `check-data.mjs` die Summe gegen 278.
- `plan.x` / `plan.y` — Markerposition in Prozent der Planfläche. Solange
  sie fehlen, zeigt der Situationsplan nur die Baubereichsliste; die ist
  ohnehin der barrierefreie Zugang und bleibt danach bestehen.
- `text.de` / `text.en` — Kurztext je Baubereich, optional.

## 4. Bilder — `src/assets/`

Inhalt von `assets/` (bzw. `assets/web/`) hierher kopieren, dann
`src/data/galerie.json` füllen:

```json
{
  "id": "hof-01",
  "src": "../assets/hof-01.jpg",
  "alt": { "de": "…", "en": "…" },
  "caption": { "de": "…", "en": "…" },
  "order": 10,
  "hero": false
}
```

Die Legenden stehen im Handoff bei den Bildern. Zusätzlich gebraucht:

- Hero-Bild je Screen — an `Hero.astro` als `image` durchgeben
- Situationsplan als Bild — an `Situationsplan.astro` als `plan` durchgeben
- Logo — für Header und Favicon

## 5. Distanztabelle — `src/data/distanzen.json`

Je Ziel: `ziel` (DE/EN), `meter`, `minutenFuss`, `minutenOev`,
`minutenAuto`, `kategorie` (`alltag`, `bildung`, `oev`, `freizeit`,
`zentrum`), `order`. Spalten ohne einen einzigen Wert werden nicht
gerendert.

## 6. Energiekonzept — `src/data/energie.json`

Je Position: `thema` (DE/EN), `kennwert`, `einheit`, `erlaeuterung`
(DE/EN), `icon` (Lucide-Name, kebab-case), `order`.

## 7. Standort — `src/data/projekt.json`

`koordinaten.lat` und `koordinaten.lng` setzen, sonst bleibt die Karte
ausgeblendet.

## 8. Schriften — `public/fonts/`

`npm run fonts` holt Readex Pro von Google Fonts und legt es lokal ab;
ausgeliefert wird nur von der eigenen Domain. Es kommt eine Variable Font,
die die Achse 200–700 abdeckt — `src/styles/fonts.css` hat entsprechend
eine einzige `@font-face`-Regel mit `font-weight: 200 700`. Nichts zu tun,
solange das Skript nicht abbricht.

## 9. Wohnungsspiegel

Bleibt aus. Freischalten heisst: `src/data/wohnungen.json` mit echten
Daten füllen **und** `features.wohnungsspiegel` in `src/lib/flags.ts` auf
`true` setzen. Das Schema hat bewusst kein Preisfeld.

## 10. Impressum und Datenschutz

Der Footer verlinkt `/impressum` und `/datenschutz` (bzw. `/en/…`). Beide
Seiten fehlen noch — Inhalt liegt nicht im Handoff.

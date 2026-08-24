# Offene Punkte aus dem Design-Handoff

Der Werte-Patch aus dem Handoff ist eingearbeitet (Stand 24.08.2026), der
Abgleich mit dem Entwurfsexport vom selben Tag ebenfalls.
`npm run check:data` meldet **0 Fehler, 1 offenen Punkt**. Was hier steht, ist
der Rest — und warum er offen ist.

## Eingearbeitet

| Punkt | Ergebnis |
| --- | --- |
| Design-Tokens | `src/styles/tokens.css` vollständig ersetzt, 97 Custom Properties. Papier-Grund `#f5f3ee`, Bronze-Akzent `#a9722f`, Waldgrün `#2c332b` |
| 17 Baubereiche | Labels (`01D` … ), Vollgeschosse 3–8, Markerpositionen in Prozent, Kurztexte DE/EN |
| Distanztabelle | 6 Ziele mit Metern, Fuss-, ÖV- und Autozeiten |
| Energiekonzept | 9 Positionen mit Kennwerten und Erläuterung |
| Koordinaten | 47.36438 / 8.37068 — die Karte rendert |
| Projekttexte | Meta, Titel, Lead und Kicker für 6 Screens, DE und EN |
| Domain | `birkenhain.ch` ohne www, live nachgemessen — `www.` leitet pfadtreu per 301 dorthin |
| Wohnungen je Baubereich | 17 Werte aus dem Entwurfsexport, Summe exakt 278 — `check:data` erzwingt sie |
| Anmeldeformular | Feldsatz des Entwurfs: Fläche ab, Bezugstermin als Auswahl, unterstrichene Felder, Knopf über die ganze Breite |
| Karte | im Planrahmen mit Adresszeile und Google-Maps-Link, wie im Entwurf — die Tiles bleiben von OpenStreetMap |

Neu dazugekommen ist der **Kicker** je Screen — die Zeile über dem Titel,
`--fs-caption` / `--fw-bold` / `--ls-caps` / `--c-accent`. Eigene Klasse
`.hero__kicker`, nicht `.eyebrow`: die trägt auch Footer-Spalten,
Formular-Legenden und das 404-Label und soll leise bleiben.

## 1. Bilder — geliefert und eingebunden, wo es einen Platz gibt

Alle 16 Dateien aus dem Design liegen in Originalauflösung in `src/assets/`.
`galerie.json` trägt die acht Galerieeinträge — `galerie.pending.json` ist
damit weg, der Zwischenschritt hat seinen Zweck erfüllt. Eingebunden ist,
wofür der Code einen Platz vorsieht:

| Bild | eingebunden als |
| --- | --- |
| `arrival.jpg` | Hero der Startseite (`hero: true` im Datensatz, lädt eager) |
| `aerial.jpg` | Hero Lage & Mobilität — Bild und Alt-Text aus dem Galerie-Datensatz |
| `situationsplan.png` | `Situationsplan.astro` als `plan` auf der Startseite |
| die acht Galeriebilder | Galerie und Lightbox |

Geliefert, aber noch ohne Platz im Code — die Sektionen aus dem Entwurf
existieren als Komponenten noch nicht:

| Datei | vorgesehene Verwendung laut Design |
| --- | --- |
| `logo.svg` / `logo.png` | Header (30 px), Footer invertiert, Favicon, OG-Fallback |
| `dorfplatz.png` | Freiraum — Detailplan Quartierplatz, sechs Prozent-Labels |
| `wegnetz.png` | Freiraum — Diagramm Wegnetz (705 px breit, nicht darüber skalieren) |
| `signaturbaum.png` | Freiraum — Referenzbild Birkenhain |
| `interior-living.png`, `interior-kitchen.png` | Wohnungen — Wohnraum und Küche |
| `facade.jpg`, `salon.jpg` | Architektur — Materialisierung, Sockelnutzungen (in der Galerie sind sie schon) |

Die Heroes von Architektur, Freiraum, Nachhaltigkeit und Wohnungen zeigen
weiter den Platzhalter: das Handoff legt für diese Seiten kein Hero-Bild
fest, und geraten wird nicht.

## 2. Impressum und Datenschutz — Entwurf liegt, Prüfung fehlt

Beide Seiten tragen jetzt ausformulierte Entwürfe statt eines TODO. Der
Datenschutztext ist aus der tatsächlichen Umsetzung geschrieben: Formularfelder,
Double-Opt-In mit Sieben-Tage-Löschfrist, HMAC-Index auf der Adresse, der
IP-Zähler des Rate-Limits, die erst nach Klick ladende Karte, keine Cookies,
Schriften von der eigenen Domain. Was dort steht, tut die Website nachweislich so.

**Was fehlt, steht sichtbar in der Seite selbst** — bronzefarben markiert, nicht
in einem Kommentar versteckt:

| Seite | offene Angabe |
| --- | --- |
| Impressum | Firmenbezeichnung, Adresse, UID (CHE), zeichnungsberechtigte Person |
| Impressum | E-Mail und Telefon für Anfragen |
| Datenschutz | Adresse und E-Mail der verantwortlichen Stelle |
| Datenschutz | Name und Sitz des Hosting-Anbieters |
| Datenschutz | Aufbewahrungsdauer der Server-Zugriffsprotokolle |

**Beides muss juristisch geprüft werden, bevor `features.indexable` auf `true`
geht.** Ein Entwurf aus der Technik ist eine gute Grundlage und keine
Rechtsberatung.

## 3. Footer-Kontakt

Adresse, Telefon und E-Mail fehlen im Handoff.

## 4. Wohnungen je Baubereich — eingearbeitet

Nicht mehr offen. Der Entwurfsexport vom 24.08.2026 trägt alle 17 Werte, und
sie ergeben in der Summe genau **278** — die Zahl, die `check:data` ohnehin
erzwingt. Damit sind sie kein prozeduraler Platzhalter mehr, sondern ein
konsistenter Datensatz aus dem Entwurf; die Prüfung der Summe belegt es bei
jedem Lauf.

`src/data/wohnungen.json` bleibt weiter leer, `features.wohnungsspiegel` bleibt
`false`: das ist der Wohnungsspiegel je Wohnung, nicht je Baubereich.

## 5. Drei Unterlagen als PDF

Der Abschnitt «Planung & Mitwirkung» und die Footer-Spalte «Planung» sind
fertig verdrahtet und warten nur auf die Dateien. Liegt eine nicht in
`public/dokumente/`, bleibt die Zeile stehen — ohne Link und ohne Pfeil. Ein
toter Download wäre schlimmer als eine sichtbare Lücke, darum prüft
`Planung.astro` zur Buildzeit, ob die Datei da ist.

| Datei in `public/dokumente/` | Beschriftung im Entwurf |
| --- | --- |
| `planungsbericht-gp-birkenhain.pdf` | Planungsbericht nach Art. 47 RPV · PDF · 3.12.2025 |
| `situationsplan-1-500.pdf` | Situationsplan 1:500 · PDF · 6.11.2025 |
| `sondernutzungsvorschriften.pdf` | Sondernutzungsvorschriften · PDF · 3.12.2025 |

**Welche Fassung öffentlich wird, entscheidet die Bauherrschaft, nicht der
Build.** Es liegen mehrere Versionen des Planungsberichts vor; die falsche zu
publizieren wäre schlimmer als eine Woche ohne Download.

## Nicht gerendert, aber gepflegt

`src/data/energie.json` (9 Positionen) und `src/data/distanzen.json` (6 Ziele)
haben derzeit keine Ansicht. Der Entwurf zeigt das Energiekonzept als vier
Karten aus dem Dictionary und die Distanzen als eine Liste — beides steht so
in `EnergieKarten.astro` und `DistanzListe.astro`. Die zweite Darstellung
derselben Zahlen (`EnergieListe`, `DistanzTabelle`) war im Entwurf nicht
vorgesehen und ist entfernt; sie stand zusätzlich mit derselben
Überschrifts-ID im Dokument.

Die Datenfiles bleiben: `check:data` prüft sie, und sie sind der belegte
Stand. Wer eine Tabelle zurückholt, hat die Werte damit zur Hand.

## Bewusst nicht gemacht

**Velodistanz und Taktfrequenz** als Felder in `distanzen.json`. Der Entwurf
nennt beides (Dietikon/Bremgarten 20–30 Min., S17 im 15-Minuten-Takt), das
Schema kennt sie nicht. Sie stehen in der Distanzliste und in
`lage.metaDescription` — dort gehören sie hin. Leere optionale Felder
anzulegen wäre spekulativ.

**Eine Vorauswahl in den drei Auswahllisten des Formulars.** Der Entwurf zeigt
sie mit Werten (4.5 Zimmer, 100 m², flexibel) — ein Select kann nicht leer
aussehen. Übernommen wäre das eine protokollierte Angabe, die niemand gemacht
hat: jede Anmeldung ohne Klick käme als «4.5 Zimmer» in die Ablage. Die Listen
beginnen deshalb mit «noch offen», einer Option, die der Entwurf selbst
vorsieht.

**Den Kurztext je Baubereich aus dem Panel entfernen.** Der Entwurf zeigt im
Situationsplan-Panel nur die Kennwerte. Der Text kommt aber aus demselben
Handoff, ist zweisprachig gepflegt und beantwortet genau die Frage, die ein
Klick auf ein Haus stellt. Er bleibt.

**Die Karte durch einen Google-Maps-Embed ersetzen.** Genau das zeigt der
Entwurf. Der Rahmen, die Adresszeile und der Link «In Google Maps öffnen» sind
übernommen; die Tiles kommen weiter von OpenStreetMap. Ein iframe von Google
wäre ein Third-Party-Embed, und die Datenschutzerklärung sagt, dass es keines
gibt.

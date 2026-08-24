# Offene Punkte aus dem Design-Handoff

Der Werte-Patch aus dem Handoff ist eingearbeitet (Stand 24.08.2026).
`npm run check:data` meldet **0 Fehler, 2 offene Punkte**. Was hier steht, ist
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

## 4. Wohnungen je Baubereich

Bleibt bewusst `null`. Die Zahlen im Prototyp waren prozedural erzeugt, echte
Werte je Baubereich liegen nicht vor. Die Gesamtzahl **278** ist gesichert und
wird von `check:data` erzwungen. Sind eines Tages alle 17 gefüllt, prüft das
Skript zusätzlich, dass die Summe 278 ergibt.

`src/data/wohnungen.json` bleibt leer, `features.wohnungsspiegel` bleibt
`false`.

## Bewusst nicht gemacht

**Velodistanz und Taktfrequenz** als Felder in `distanzen.json`. Der Entwurf
nennt beides (Dietikon/Bremgarten 20–30 Min., S17 im 15-Minuten-Takt), das
Schema kennt sie nicht. Sie stehen bereits in `lage.metaDescription` — dort
gehören sie hin. Leere optionale Felder anzulegen wäre spekulativ.

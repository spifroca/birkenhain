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
| Domain | `www.birkenhain.ch`, live nachgemessen |

Neu dazugekommen ist der **Kicker** je Screen — die Zeile über dem Titel,
`--fs-caption` / `--fw-bold` / `--ls-caps` / `--c-accent`. Eigene Klasse
`.hero__kicker`, nicht `.eyebrow`: die trägt auch Footer-Spalten,
Formular-Legenden und das 404-Label und soll leise bleiben.

## 1. Bilder — der letzte grosse Block

Die acht Galeriebilder fehlen. Die Daten dazu liegen fertig in
**`src/data/galerie.pending.json`** und warten nur darauf:

```
arrival.jpg   ← Hero der Startseite
aerial.jpg   passage.jpg   forestedge.jpg
rooftop.jpg  facade.jpg    salon.jpg   snow.jpg
```

**So wird es scharf:** die **Originale** aus
`design_handoff_im_birkenhain/assets/` nach `src/assets/` kopieren — nicht
`assets/web/`, die sind 1800 px breit und die 2000-px-Stufe würde
hochskaliert. Dann `galerie.pending.json` nach `galerie.json` umbenennen.

Der Zwischenschritt ist nötig, weil `image()` den Pfad zur Buildzeit auflöst:
ein fehlendes Bild bricht den Build. Deshalb liegen die Daten daneben statt
drin.

Zusätzlich gebraucht, nicht in der Galerie:

| Datei | Verwendung |
| --- | --- |
| `logo.svg` | Header (30 px), Footer invertiert, Favicon |
| `situationsplan.png` | `Situationsplan.astro` als `plan` (1464 × 1069) |
| `dorfplatz.png` | Freiraum, Detailplan Quartierplatz |
| `wegnetz.png` | Freiraum, Diagramm Wegnetz |
| `signaturbaum.png` | Freiraum, Referenzbild Birkenhain |
| `interior-living.png`, `interior-kitchen.png` | Wohnungen |

Solange sie fehlen, zeigen Hero und Situationsplan einen Platzhalter. Die
Baubereichsliste im Situationsplan funktioniert schon — sie ist ohnehin der
barrierefreie Zugang und bleibt danach bestehen.

## 2. Impressum und Datenschutz

Inhalt liegt nicht vor, beides braucht juristische Prüfung. Belegt ist
bisher nur: **Bauherrin ist die Real North AG** (steht im Footer).

Der Datenschutztext muss die Leaflet/OSM-Einbindung und den
Formular-Endpoint abdecken. Was die Website technisch tatsächlich bearbeitet,
ist auf `/datenschutz` aus dem Code belegt aufgeführt — als Grundlage, nicht
als Ersatz.

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

## Erwartete Build-Meldungen

Solange `galerie.json` leer ist:

```
The collection "galerie" does not exist or is empty.
Please check your content config file for errors.
```

Die Config ist in Ordnung. Astro behandelt eine leere `file()`-Collection wie
eine fehlende und formuliert es irreführend. Verschwindet mit den Bildern.

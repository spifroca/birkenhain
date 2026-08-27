# Logos von Beteiligten

Hier liegen Logos, die nicht zum Projekt selbst gehören — das Birkenhain-Logo
steht in `src/assets/`.

## Erwartet

| Datei | Wo es erscheint |
| --- | --- |
| `suisse-plan.svg` | Abschnitt «Planung & Mitwirkung», unter den Unterlagen |

Die Datei liegt vor: das offizielle Logo (Fassung 2023) von suisseplan.ch,
Glyphen als Pfade, keine Nachzeichnung. Entfernt wurden nur
Editor-Metadaten (Illustrator/Inkscape) sowie feste Masse; die `viewBox`
ist unverändert. Fehlte sie, würde `Planung.astro` an der Stelle nichts
rendern — kein Rahmen, kein Alt-Text, keine kaputte Bildreferenz.

## Anforderungen an die Datei

- **SVG**, keine Pixelgrafik. Das Logo wird auf 44 px Höhe skaliert und muss
  auch auf Bildschirmen mit hoher Auflösung scharf bleiben.
- **Ohne feste Breite und Höhe** im `<svg>`-Tag, aber **mit `viewBox`** —
  sonst lässt sich die Höhe nicht per CSS setzen und das Seitenverhältnis
  bricht.
- Farben im Original: schwarzer Schriftzug, roter Rahmen. Das Logo wird nicht
  umgefärbt und nicht auf farbigem Grund gezeigt.
- Bevorzugt vom Rechteinhaber geliefert. Eine Nachzeichnung trifft die
  Hausschrift nicht und stellt eine fremde Wortmarke falsch dar.

## Warum `public/` und nicht `src/assets/`

An einem Vektor hat die Bildpipeline nichts zu optimieren — kein AVIF, kein
`srcset`. Und aus `public/` bricht der Build nicht ab, wenn die Datei fehlt:
`src/assets/` würde über `image()` zur Buildzeit aufgelöst und ein fehlendes
Bild wäre ein Fehler statt einer Lücke.

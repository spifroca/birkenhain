# Filme

| Datei | Wo sie erscheint |
| --- | --- |
| `movie.mp4` | Startseite, Bildband ganz oben |

Der Film liegt hier und nicht nur auf dem Server: Plesk räumt beim Deploy
den Zielordner, bevor es schreibt. Was nicht aus dem Repository kommt, ist
nach dem nächsten Merge weg.

Der aktuelle Stand: 1470 × 630, 15 Sekunden, H.264, 18,2 MB.

## Wie er läuft

Stumm, in Schleife, ohne Bedienelemente, mit 0.6-facher Geschwindigkeit —
ruhiger als aufgenommen, weil er Stimmung trägt und nicht Handlung. Das
Hero-Bild liegt darunter: es steht sofort da, während der Film lädt, es
vertritt ihn ohne JavaScript, und es bleibt stehen, wenn jemand
`prefers-reduced-motion` gesetzt hat.

Fehlt die Datei, zeigt der Bildband das Bild allein — kein leerer Kasten,
keine kaputte Referenz. `Hero.astro` entscheidet das zur Buildzeit.

## Wenn der Film ersetzt wird

- **MP4 mit H.264.** Das spielt jeder Browser ab.
- **Unter 100 MB**, sonst nimmt GitHub die Datei nicht an.
- **Querformat.** Der Bildband schneidet mit `object-fit: cover` zu, das
  Wichtige gehört in die Bildmitte.
- **Tonspur darf weg.** Der Film läuft stumm; die vorhandene Spur wird nie
  abgespielt und kostet nur Bytes.
- **Kürzer und stärker komprimiert ist besser.** 18,2 MB auf 15 Sekunden
  sind rund 10 Mbit/s — für eine stumme Schleife im Hintergrund reichen 3
  bis 4 Mbit/s, das wäre etwa ein Viertel der Datenmenge bei kaum
  sichtbarem Unterschied.

Der Dateiname wird in `Home.astro` gesetzt (`video="movie.mp4"`); ein
anderer Name gehört dort nachgeführt.

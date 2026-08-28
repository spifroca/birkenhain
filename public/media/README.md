# Filme

| Datei | Wo sie erscheint |
| --- | --- |
| `movie.mp4` | Startseite, Bildband ganz oben |

Der Film liegt hier und nicht nur auf dem Server: Plesk räumt beim Deploy
den Zielordner, bevor es schreibt. Was nicht aus dem Repository kommt, ist
nach dem nächsten Merge weg.

Der aktuelle Stand: 1470 × 630, 24 fps, 15 Sekunden, H.264, **5,6 MB**
(3,1 Mbit/s, ohne Tonspur, `faststart`).

Die Ausgangsdatei war mit 18,2 MB und 10 Mbit/s dreimal so schwer. Neu
kodiert mit:

```
ffmpeg -i quelle.mp4 -an -c:v libx264 -preset slower -crf 26 \
  -maxrate 6M -bufsize 12M -profile:v high -level 4.0 \
  -pix_fmt yuv420p -g 48 -movflags +faststart movie.mp4
```

`-an` wirft die Tonspur weg, die nie abgespielt wird. `-movflags
+faststart` legt den Index an den Dateianfang, sonst beginnt die Wiedergabe
erst nach dem vollstaendigen Download. `-g 48` setzt alle zwei Sekunden ein
Keyframe, damit die Schleife sauber neu ansetzt.

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

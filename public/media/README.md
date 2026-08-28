# Filme

Hierher gehört `move.mp4` — der Film, der auf der Startseite an die Stelle
des Hero-Bildes tritt.

| Datei | Wo sie erscheint |
| --- | --- |
| `move.mp4` | Startseite, Bildband ganz oben |

**Diese Datei fehlt noch.** Solange sie fehlt, zeigt der Bildband das
Hero-Bild aus der Galerie — kein leerer Kasten, keine kaputte Referenz.
Sobald das MP4 hier liegt, läuft es beim nächsten Build von selbst. Es ist
keine Codeänderung nötig.

## Anforderungen

- **MP4 mit H.264 und AAC** (oder ganz ohne Tonspur — der Film läuft stumm).
  Das ist das Format, das jeder Browser abspielt.
- **Unter 100 MB**, sonst nimmt GitHub die Datei nicht an. Richtwert für
  1080p: 4–6 Mbit/s, also rund 35–45 MB je Minute. Kürzer ist besser: der
  Film läuft in Schleife, 15–30 Sekunden genügen.
- **Ohne Ton produzieren oder Tonspur entfernen.** Der Film startet von
  selbst und muss dafür stumm sein; eine mitgelieferte Tonspur wäre nur
  Ballast.
- **Querformat**, ungefähr 16:9. Der Bildband schneidet mit `object-fit:
  cover` zu, das Wichtige gehört in die Bildmitte.

Die Datei gehört ins Repository, nicht per FTP auf den Server: Plesk räumt
beim Deploy den Zielordner: was nicht im Build liegt, ist nach dem nächsten
Merge weg.

## Wie er läuft

Stumm, in Schleife, ohne Bedienelemente, mit 0.6-facher Geschwindigkeit —
ruhiger als aufgenommen, weil er Stimmung trägt und nicht Handlung. Das
Hero-Bild bleibt sein Poster: es steht, bis der Film Daten hat, und es
bleibt stehen, wenn jemand `prefers-reduced-motion` gesetzt hat.

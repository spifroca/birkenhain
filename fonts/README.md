# Schriften

`npm run fonts` legt hier `readex-pro-variable.woff2` ab.

Readex Pro ist auf Google Fonts eine Variable Font: eine Datei deckt die
Achse 200–700 ab. Die css2-API liefert zwar sechs @font-face-Bloecke mit
diskreten Weights, die aber alle auf dieselbe Datei zeigen — wer nach
Weight benennt, lädt sechsmal dasselbe (188 KB statt 31 KB). Das Skript
dedupliziert deshalb nach URL und bricht ab, falls Google je auf statische
Instanzen umstellt.

Die woff2-Dateien sind per `.gitignore` aus dem Repo ausgenommen — sie werden
pro Umgebung geholt statt als Binaries mitversioniert. Läuft der Build ohne
Netzzugriff, die Dateien einmal committen und die Zeile `public/fonts/*.woff2`
aus der `.gitignore` entfernen.

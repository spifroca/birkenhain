# Schriften

`npm run fonts` legt hier Readex Pro als woff2 ab
(`readex-pro-200.woff2` … `readex-pro-700.woff2`).

Die woff2-Dateien sind per `.gitignore` aus dem Repo ausgenommen — sie werden
pro Umgebung geholt statt als Binaries mitversioniert. Läuft der Build ohne
Netzzugriff, die Dateien einmal committen und die Zeile `public/fonts/*.woff2`
aus der `.gitignore` entfernen.

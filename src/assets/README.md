# Bilder

Hier liegen die Bildoriginale. Astro optimiert sie zur Buildzeit
(AVIF/WebP, `srcset` 640/1024/1600/2000) — siehe
`src/components/Picture.astro`.

TODO(handoff): Inhalt von `design_handoff_im_birkenhain/assets/` hierher
kopieren. Die komprimierten Web-Varianten aus `assets/web/` genügen als
Quelle, wenn sie mindestens 2000 px breit sind; sonst die Originale nehmen,
damit die 2000-px-Stufe nicht hochskaliert wird.

Referenziert werden die Dateien aus `src/data/galerie.json` relativ zu dieser
Datei, also z. B. `../assets/hero.jpg`.

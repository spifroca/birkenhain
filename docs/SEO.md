# Suchmaschinen: Stand und Grenze

Gemessen am 27.08.2026 gegen die live ausgelieferten Seiten.

## Die Sperre bleibt

`features.indexable` ist `false`. Solange das so ist, trägt jede Seite
`<meta name="robots" content="noindex, follow">`, `/robots.txt` sagt
`Disallow: /`, und `/sitemap.xml` ist gültiges, aber leeres XML. **Diese
Sperre wird nicht als SEO-Massnahme gelöst.** Sie fällt erst, wenn Impressum
und Datenschutz juristisch geprüft sind — so steht es in `CLAUDE.md`, und
dieses Dokument ändert daran nichts.

Alles hier Beschriebene wirkt also erst mit der Freigabe. Es liegt bereit,
statt am Tag der Freigabe erst gebaut zu werden.

## Was schon vorher stimmte

| Zusage | Wo |
| --- | --- |
| Ein `<title>` und eine `<meta name="description">` je Seite und Sprache | `BaseLayout.astro`, Texte im Wörterbuch |
| `rel="canonical"` auf die Adresse, die 200 liefert (ohne `www.`) | `src/lib/seo.ts`, in der CI gegen Abdriften geprüft |
| `hreflang` für `de-CH`, `en` und `x-default` | `src/lib/seo.ts` |
| `<html lang>` je Sprache | `BaseLayout.astro` |
| Sitemap mit `xhtml:link`-Alternates, gespeist aus den Routen | `src/pages/sitemap.xml.ts` |
| `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale` | `BaseLayout.astro` |
| Sprechende Alt-Texte in beiden Sprachen | `src/data/galerie.json` |
| Skip-Link, eine `<h1>` je Seite | `BaseLayout.astro`, Screens |

## Was am 27.08.2026 dazugekommen ist

**Vorschaubild.** Vorher gab es kein `og:image`. Jeder geteilte Link — WhatsApp,
LinkedIn, Slack, Teams — zeigte die Seite ohne Bild, und das ist der Ort, an
dem ein Link überhaupt angeklickt wird. `BaseLayout.astro` erzeugt jetzt zur
Buildzeit aus `src/assets/arrival.jpg` ein 1200 × 630 grosses JPEG und setzt
`og:image`, `og:image:type`, `og:image:width`, `og:image:height` und
`og:image:alt`. Dazu `twitter:card=summary_large_image` mit Bild und Alt-Text —
Titel und Beschreibung liest Twitter aus den `og:`-Tags mit.

Die URL im Tag ist absolut. Scraper lösen relative Pfade nicht auf.

**Strukturierte Daten.** `src/components/StructuredData.astro` gibt auf der
Startseite ein `ApartmentComplex`-Objekt aus: Name, URL, Beschreibung, Bild,
Anzahl Wohnungen, Gemeinde, Kanton, Land, Koordinaten, Sprache. Jede Angabe
stammt aus `src/data/projekt.json` oder aus dem Wörterbuch — es steht nichts
drin, was nicht auch auf der Seite steht.

**Kein `Offer`, kein Preis, kein Datum.** Mietpreise und Vermietungsstart sind
nicht publiziert; ein `Offer` ohne Preis wäre eine leere Behauptung, und ein
erfundener wäre ein Regelbruch. Nur auf der Startseite: dasselbe Objekt auf
jeder Unterseite zu wiederholen bringt nichts und riskiert, dass die falsche
Seite als Einstieg gewählt wird.

**Titel- und Beschreibungslängen.** Vorher waren sieben Beschreibungen zu lang
(bis 174 Zeichen, sie werden um 160 herum abgeschnitten), vier zu kurz (ab 64
Zeichen, verschenkter Platz) und ein Titel zu lang (69 Zeichen).

Jetzt: alle 20 `metaTitle` bis 60 Zeichen, alle 20 `metaDescription` zwischen
110 und 160 Zeichen. Nachprüfbar:

```bash
node -e "
for (const f of ['de','en']) {
  const d = JSON.parse(require('fs').readFileSync('src/i18n/'+f+'.json','utf8'));
  for (const [sec, obj] of Object.entries(d)) {
    if (typeof obj !== 'object') continue;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== 'string') continue;
      if (k === 'metaDescription' && (v.length < 110 || v.length > 160)) console.log(f, sec, v.length);
      if (k === 'metaTitle' && v.length > 60) console.log(f, sec, v.length);
    }
  }
}"
```

Keine Ausgabe heisst: alles im Rahmen.

## Was bewusst nicht gemacht wurde

- **Kein `twitter:site`.** Es gibt keinen bekannten Account. Ein erfundener
  Handle zeigt in der Vorschau auf ein fremdes Profil.
- **Keine Analytics, kein Tag Manager.** Die Site ist cookiefrei; ein Zähler
  würde den Datenschutztext ändern, und das ist eine Entscheidung, keine
  Optimierung.
- **Keine Keyword-Streuung in den Fliesstexten.** Die Zahlen und Begriffe
  stehen ohnehin im Text, weil sie zum Projekt gehören.
- **Kein `og:image` je Seite.** Ein gutes Bild für alle Seiten schlägt kein
  Bild; ein eigenes je Seite ist die nächste Stufe, nicht die erste.

## Am Tag der Freigabe

1. Impressum und Datenschutz juristisch geprüft und die offenen Angaben
   ergänzt (`reviewNote` in beiden Texten verschwindet dann).
2. `features.indexable` auf `true` — **erst dann**.
3. Nachmessen: `/robots.txt` ohne `Disallow: /`, mit `Sitemap:`-Zeile;
   `/sitemap.xml` mit 20 `<url>`-Einträgen; auf jeder Seite
   `content="index, follow"`.
4. Vorschaubild einmal wirklich prüfen — Link in WhatsApp oder LinkedIn
   einfügen und schauen, ob das Bild kommt. Scraper cachen; ein Fehler fällt
   sonst erst Tage später auf.

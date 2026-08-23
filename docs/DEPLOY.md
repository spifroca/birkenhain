# Deployment

Cloudflare Pages. Der Astro-Build liefert `dist/`, die Pages Functions aus
`functions/` werden automatisch unter `/api/` montiert.

## Stand

| Schritt | Status |
| --- | --- |
| KV-Namespace `BIRKENHAIN_KV` | angelegt, ID in `wrangler.toml` |
| Pages-Projekt | offen |
| Secrets | offen |
| Custom Domain | offen |
| Mail-Provider verifiziert | offen |
| Inhalte | offen, siehe `HANDOFF-TODO.md` |

Die Site ist bis zur Freigabe für Suchmaschinen gesperrt:
`features.indexable` in `src/lib/flags.ts` ist `false`, dadurch liefert
`robots.txt` ein `Disallow: /` und jede Seite ein `noindex`. Das ist der
Schalter für den Launch — nicht vor den echten Inhalten umlegen.

## 0. CI

`.github/workflows/ci.yml` läuft bei jedem Push auf `main` und bei jedem
Pull Request auf GitHubs Runnern — dort ist npm erreichbar. Geprüft werden
`astro check`, die Endpoint-Typen, die Projektfakten und der Build; das
Ergebnis liegt als `dist`-Artefakt am Lauf. Ein zweiter, nicht blockierender
Job holt die Schriften, damit ein Bruch im Font-Skript sichtbar wird, ohne
den PR rot zu färben.

Solange kein `package-lock.json` im Repo liegt, läuft `npm install` statt
`npm ci` und der Lauf setzt eine Warnung. Nach dem ersten lokalen
`npm install` das Lockfile committen — dann ist der Build reproduzierbar.

## 1. Lokal prüfen

Auf dem eigenen Rechner, in einem Clone des Repos, mit Node aus `.nvmrc`:

Bevor irgendetwas deployed wird:

```bash
npm install
npm run fonts        # Readex Pro nach public/fonts/
npm run check        # Astro: Typen und Templates
npm run check:functions
npm run check:data   # listet die offenen Werte
npm run build
npm run preview
```

## 2. Pages-Projekt anlegen

```bash
npx wrangler login
npx wrangler pages project create birkenhain --production-branch main
```

## 3. Secrets setzen

```bash
openssl rand -base64 48   # Wert für OPT_IN_SECRET, mindestens 32 Zeichen

npx wrangler pages secret put OPT_IN_SECRET  --project-name birkenhain
npx wrangler pages secret put MAIL_API_KEY   --project-name birkenhain
npx wrangler pages secret put MAIL_FROM      --project-name birkenhain
npx wrangler pages secret put MAIL_NOTIFY_TO --project-name birkenhain
```

Ohne `OPT_IN_SECRET` mit mindestens 32 Zeichen verweigert der Endpoint den
Dienst — bewusst, damit eine fehlende Konfiguration nicht als stiller
Fehler durchläuft.

## 4. Erster Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name birkenhain
```

## 5. Git-Anbindung

Im Dashboard das Repo `spifroca/birkenhain` verbinden, damit Pushes auf
`main` automatisch deployen.

**Build-Command muss `npm run fonts && npm run build` sein.** Die
woff2-Dateien sind per `.gitignore` ausgenommen; mit nur `npm run build`
deployst du eine Site ohne Schriften. Alternative: die Dateien einmal
committen und die Zeile `public/fonts/*.woff2` aus der `.gitignore`
entfernen — dann genügt `npm run build`.

- Build-Command: `npm run fonts && npm run build`
- Output-Verzeichnis: `dist`
- Node-Version: siehe `.nvmrc`

`nodejs_compat` ist nicht nötig: der Endpoint nutzt nur Fetch, Web Crypto
und FormData.

## 6. Domain

Custom Domain im Pages-Projekt hinterlegen, DNS bei Cloudflare. Weicht die
Domain von `im-birkenhain.ch` ab, `site` in `astro.config.mjs` anpassen —
Canonical, `hreflang` und Sitemap hängen daran.

## 7. Vor der Freigabe

Solange Platzhalter ausgeliefert werden, zusätzlich zum `noindex` die
Vorschau schützen: Cloudflare Access mit Passwort vor das Projekt legen.
`robots.txt` hält Suchmaschinen fern, aber nicht Menschen mit dem Link.

## Launch-Checkliste

- [ ] `HANDOFF-TODO.md` abgearbeitet, `npm run check:data` ohne offene Punkte
- [ ] Impressum und Datenschutzerklärung juristisch geprüft und eingesetzt
- [ ] Absenderdomain beim Mail-Provider verifiziert (SPF/DKIM)
- [ ] Anmeldung einmal echt durchgespielt: Formular, Mail, Bestätigungslink,
      interne Benachrichtigung
- [ ] Formular ohne JavaScript getestet (Redirect auf die Statusseite)
- [ ] Rate-Limit greift (mehr als 5 Versuche pro Stunde)
- [ ] Karte lädt erst nach Klick, im Netzwerk-Tab vorher kein OSM-Request
- [ ] Tastatur-Durchgang: Skip-Link, Navigation, Situationsplan, Lightbox
- [ ] Lighthouse und axe auf `/` und `/anmeldung`
- [ ] `features.indexable` auf `true`, Deploy, `robots.txt` und
      `sitemap.xml` im Browser prüfen
- [ ] Cloudflare Access entfernen

# Briefing: birkenhain.ch veröffentlichen

Für eine neue Claude-Code-Session auf `spifroca/birkenhain`.
**Ziel: die Site geht live auf `birkenhain.ch` und sieht aus wie der
Entwurf.** Stand dieses Briefings: 24.08.2026, 07:32 UTC.

---

## Was das Projekt ist

Projektwebsite der Wohnüberbauung «Im Birkenhain», Areal Isleren,
Rudolfstetten-Friedlisberg (AG). Astro 5, static output, TypeScript. Sieben
Screens als echte Routen in DE und EN, plus Impressum, Datenschutz, 404 und
fünf Statusseiten der Anmeldung — 30 Seiten insgesamt.

Das Anmeldeformular ist ein PHP-Endpoint mit Double-Opt-In. Kein Node auf dem
Server, kein Composer, keine Datenbank-Instanz — nur PHP mit SQLite.

Bauherrin: **Real North AG**. Hosting: **Plesk**.

## Wo es steht

| | |
| --- | --- |
| `main` | `f23576a` — Quellcode, drei PRs gemergt |
| `claude/new-session-1fphb2` | `367444e` — Arbeitsbranch, PR #4 offen |
| `deploy` | `b3c04d4` — nur Build-Ergebnis, gebaut aus `main` |
| Default-Branch | noch `claude/new-session-1fphb2`, sollte `main` sein |
| Live | **alter Stand**, Design-Werte nicht angekommen |
| `check:data` | 0 Fehler, 2 offene Punkte |
| `TODO(handoff)` in `src/` | 6 |

**`deploy` enthält absichtlich keinen Quellcode.** Wer dort hineinschaut und
`astro.config.mjs` oder `src/` sucht, findet nichts und zieht den falschen
Schluss. Das ist in diesem Projekt schon einmal passiert.

## Verifiziert, nicht behauptet

- Build läuft: 30 Seiten, DE und EN
- 19 Endpoint-Tests grün (`./scripts/test-endpoint.sh`, PHP-eigener Server)
- Basispfad-Fähigkeit unter echtem Unterpfad-Build geprüft
- Projektfakten in der CI erzwungen (siehe **Harte Regeln**)
- Live-Probe möglich: `birkenhain.ch` ist aus der Session erreichbar,
  `github.io` nicht

## Der Weg zum Ziel, in dieser Reihenfolge

### 1. PR #4 mergen

Trägt zwei Dinge: die Rechtstext-Entwürfe und `include-hidden-files: true`
beim Artefakt-Upload. Ohne den zweiten fehlen im herunterladbaren Zip beide
`.htaccess` — der Deploy-Branch ist davon nicht betroffen.

### 2. Plesk Git einrichten — bringt die Site auf den neuen Stand

*Websites & Domains* → Domain → **Git** → Repository hinzufügen:

| Feld | Wert |
| --- | --- |
| URL | `https://github.com/spifroca/birkenhain.git` |
| Branch | **`deploy`** |
| Ziel | `httpdocs` |

Vorher `httpdocs` einmal leeren — **nicht** `birkenhain-data/`, das liegt eine
Ebene höher und trägt Konfiguration und Anmeldedaten.

Prüfen danach:

```bash
curl -s https://birkenhain.ch/ | grep -o 'rel="canonical" href="[^"]*"'   # ohne www
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/architektur/            # 200
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/api/lib/birkenhain.php  # 404
curl -s https://birkenhain.ch/ | grep -c 'a9722f'                                    # > 0 = Design da
```

Details: [`PLESK-GIT.md`](PLESK-GIT.md)

### 3. nginx-Direktiven einfügen

**Nachgemessen: nginx sitzt vor Apache, `.htaccess` wird ignoriert.** Ohne
diesen Schritt fehlen Security-Header, Asset-Caching und die Projekt-404 —
egal wie oft neu deployt wird.

Fertiger Block zum Einfügen: [`PLESK-NGINX.md`](PLESK-NGINX.md)

### 4. Die acht Bilder — der letzte Design-Block

Ohne sie zeigen Hero und Situationsplan Platzhalter. Die Galeriedaten liegen
fertig in **`src/data/galerie.pending.json`**.

1. Die **Originale** aus `design_handoff_im_birkenhain/assets/` nach
   `src/assets/` — nicht `assets/web/`, die sind 1800 px breit und die
   2000-px-Stufe würde hochskaliert.
2. `galerie.pending.json` → `galerie.json` umbenennen.

Der Zwischenschritt existiert, weil `image()` den Pfad zur Buildzeit auflöst:
ein fehlendes Bild bricht den Build. Deshalb liegen die Daten daneben statt
drin.

Zusätzlich gebraucht: `logo.svg` (Header, Footer, Favicon),
`situationsplan.png`, `dorfplatz.png`, `wegnetz.png`, `signaturbaum.png`,
`interior-living.png`, `interior-kitchen.png`. Liste mit Verwendung in
[`HANDOFF-TODO.md`](HANDOFF-TODO.md).

### 5. Rechtstexte prüfen lassen

Impressum und Datenschutz tragen ausformulierte Entwürfe. Der Datenschutztext
ist aus der tatsächlichen Umsetzung geschrieben — was dort steht, tut die
Website nachweislich so. Die offenen Angaben stehen bronzefarben **in der
Seite**: Adresse, UID, Kontakt, Hosting-Anbieter, Aufbewahrungsdauer der
Zugriffsprotokolle.

### 6. Erst dann freigeben

`features.indexable` in `src/lib/flags.ts` auf `true`. Daran hängen
`robots.txt`, die Sitemap und das `noindex` jeder Seite sowie die
Vorschau-Leiste über dem Header — ein Schalter, kein Dutzend.

**Voraussetzung: Schritte 4 und 5 sind durch.** Eine indexierte Seite ohne
geprüftes Impressum ist in der Schweiz ein rechtliches Problem, und
Platzhalter-Hero wäre der erste Eindruck im Suchergebnis.

## Harte Regeln

Diese Zahlen sind zugesagt und werden von `npm run check:data` erzwungen —
ein Verstoss macht die CI rot:

- **278 Mietwohnungen**, Miete, kein Verkauf
- **17 Baubereiche**, **3–8 Vollgeschosse**
- **oberirdisch autofrei**
- **keine Mietpreise, kein Vermietungsstart** publizieren

Weiter gilt:

- `wohnungen` je Baubereich bleibt `null` — die Zahlen im Prototyp waren
  prozedural erzeugt. Die Gesamtzahl 278 ist gesichert.
- `src/data/wohnungen.json` bleibt leer, `features.wohnungsspiegel` bleibt
  `false`. Die Komponente ist gebaut, das Schema hat kein Preisfeld.
- Keine Farb- oder Grössenliteral ausserhalb `src/styles/tokens.css`.
- Wo `TODO(handoff)` steht, fehlen echte Daten. Nicht füllen, nicht raten.

## Fallen, die schon zugeschlagen haben

Alle fünf hatten dieselbe Signatur: **eine Prüfung, die nicht mehr prüft,
sieht aus wie eine, die nichts findet.**

| Falle | Was passierte |
| --- | --- |
| Sechs woff2-Dateien à 31 428 Byte | Readex Pro ist eine Variable Font — sechsmal dieselbe Datei, 188 KB statt 31 KB. Aufgefallen an identischen Dateigrössen |
| Checksummen-Wächter unter job-weitem `continue-on-error` | Sein `exit 1` wurde verschluckt, der Wächter konnte nicht zubeissen |
| Deploy-Job am Default-Branch gekoppelt | Nach dem Merge zeigte der Default auf einen Branch ohne Pushes — grüner Lauf, alter Stand live |
| Vorschau-Job auf `main` getriggert | Das Environment `github-pages` erlaubt nur den Default-Branch. Job ohne Runner, ohne Log, zwei Sekunden |
| `.htaccess` fehlte im Artefakt | `upload-artifact` lässt Punkt-Dateien weg. `test -f dist/.htaccess` prüfte das Build-Verzeichnis, verworfen wurde beim Verpacken — falsche Stufe |

**Konsequenz für die Arbeitsweise:** einen grünen Haken nicht als Beweis
nehmen. Ins Log schauen, ob der Schritt gelaufen ist. Bei `continue-on-error`
und `if:` besonders.

## Zwei Deploy-Jobs, zwei Begründungen

Nicht vereinheitlichen — der Kommentar an beiden Stellen sagt warum:

- **`deploy-branch`** in `ci.yml` hängt **fest an `main`**. Kein
  Environment-Gate, soll der Wahrheit folgen, nicht einer Einstellung.
- **`Vorschau`** in `pages.yml` hängt am **Default-Branch**. Das Environment
  `github-pages` schreibt das vor.

## Werkzeuge

```bash
npm install
npm run fonts          # Readex Pro nach public/fonts/ (einmalig)
npm run check          # astro check
npm run check:php      # PHP-Syntax
npm run test:endpoint  # 19 Fälle gegen PHPs eingebauten Server
npm run check:data     # Projektfakten und offene Datenlücken
npm run build
```

Vor jedem Push: `check:php`, `test:endpoint`, `check:data`. Der Astro-Build
braucht `npm install` — in manchen Umgebungen ist npm durch die Egress-Policy
gesperrt, dann klärt es die CI.

## Weitere Dokumente

| Datei | Inhalt |
| --- | --- |
| [`DEPLOY.md`](DEPLOY.md) | Runbook und Launch-Checkliste |
| [`PLESK-GIT.md`](PLESK-GIT.md) | Deploy über Plesks Git-Extension |
| [`PLESK-NGINX.md`](PLESK-NGINX.md) | nginx-Direktiven zum Einfügen |
| [`PLESK-BRIEFING.md`](PLESK-BRIEFING.md) | Für einen Chat mit Browser-MCP, der Plesk bedient |
| [`HANDOFF-TODO.md`](HANDOFF-TODO.md) | Was noch fehlt, aufgeschlüsselt |
| [`PLAN.md`](PLAN.md) | Framework-Entscheid, Struktur, Datenmodell |

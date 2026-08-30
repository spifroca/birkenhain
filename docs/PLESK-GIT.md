# Deploy über Plesks Git-Extension

Damit entfällt das Herunterladen, Leeren und Entpacken bei jeder Änderung.
Einmal einrichten, danach zieht Plesk den fertigen Stand selbst.

## Wie es funktioniert

Quelle des Deploy-Branches ist **`main`**. Ein Push auf `main` baut und
schreibt neu; Pushes auf Arbeitsbranches nicht. So trägt der Branch immer den
gemergten Stand und nie einen Zwischenschritt.

Die CI baut bei jedem Push und schreibt **nur den Inhalt von `dist/`** auf
den Branch `deploy`. Der Branch enthält kein TypeScript, kein `node_modules`,
keine Konfiguration — genau das, was ins Webroot gehört: HTML, `_assets/`,
`fonts/`, `api/`, `.htaccess`, `404.html`, `robots.txt`, `sitemap.xml`.

```
Quellbranch  ──CI──▶  Branch deploy  ──Plesk Git──▶  httpdocs
```

Kein Node auf dem Server, kein Composer, kein Build beim Hoster.

Jeder Build committet **auf den bestehenden Branch**, sodass jede
Aktualisierung ein Fast-Forward ist. Das ist die Voraussetzung dafür, dass
Plesk ziehen kann: Plesk zieht mit einem Merge, und ein force-gepushter
`--orphan`-Branch hätte bei jedem Build eine neue Wurzel — `git pull` bricht
dann mit *refusing to merge unrelated histories* ab, während der CI-Lauf grün
bleibt und der Branch geschrieben aussieht. Genau daran stand die Website nach
dem ersten Klon still.

Das Repo wächst dadurch nur um das, was sich wirklich ändert: Astro hängt den
Inhalts-Hash an die Asset-Namen, ein unverändertes Bild bleibt also derselbe
Blob.

Gebaut wird **nur beim Push auf `main`** — feste Quelle, nicht an den
Default-Branch gekoppelt. Zwei Quellen für denselben Branch wären ein
Wettlauf; laufen zwei Builds gleichzeitig, setzt der Verlierer auf dem neuen
Stand neu auf, statt den anderen zu überschreiben.

## Einrichten in Plesk

*Websites & Domains* → Domain → **Git** → *Repository hinzufügen*.

| Feld | Wert |
| --- | --- |
| Repository-URL | `https://github.com/spifroca/birkenhain.git` |
| Repository-Typ | Remote (Git) |
| Branch | **`deploy`** |
| Zielverzeichnis für Deployment | `httpdocs` |
| Deployment-Modus | *Automatisch* (per Webhook) oder *Manuell* |

Bei **Automatisch** zeigt Plesk eine Webhook-URL an. Die gehört in GitHub
unter *Settings → Webhooks → Add webhook*, Content-Type
`application/json`, Event nur *Just the push event*. Danach deployt jeder
grüne Build von selbst.

Bei **Manuell** genügt der Knopf *Pull und Deployment*, wenn du willst.

Das Repo ist öffentlich, es braucht also keinen Deploy-Key.

## Vor dem ersten Pull

Plesk überschreibt beim Deployment die Dateien im Zielverzeichnis, räumt aber
nicht zwingend auf. Deshalb **einmalig** `httpdocs` leeren — inklusive einer
etwaigen Plesk-Standardseite.

**Nicht anfassen:** `birkenhain-data/` liegt eine Ebene höher und ist von
Git-Deployments nicht betroffen. Konfiguration und Anmeldedaten bleiben.

Liegt in `httpdocs` etwas, das nicht aus dem Build kommt — eine
`.htpasswd`, eine Datei vom Hoster — vorher klären statt löschen.

## Nach dem Deployment prüfen

```bash
# muss ohne www sein — die Adresse, die 200 liefert
curl -s https://birkenhain.ch/ | grep -o 'rel="canonical" href="[^"]*"'

# muss fuenf Sicherheits-Header auf JEDER Zeile zeigen (siehe PLESK-NGINX.md).
# Nicht durch ein `curl -I` ersetzen: HEAD beantwortet Plesk aus Apache und
# zeigt Header, die derselbe Pfad per GET nicht traegt. Nur der GET zaehlt.
npm run check:live-headers

# muss 200 sein
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/architektur/

# muss 404 sein
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/api/lib/birkenhain.php

# muss 405 sein
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/api/anmeldung.php
```

**Wie Plesk schreibt, ist nicht vorhersagbar — beide Male gemessen, beide
Male anders.** Aus der mtime lässt sich deshalb nichts folgern:

| Deploy | HTML | `favicon.svg`, `robots.txt`, `movie.mp4` |
|---|---|---|
| 28.08. 12:48Z (`5c6e7b3`) | neu, 12:48:30 | **alt**, 12:34:34 |
| 30.08. 04:48Z (`c74c2bc`) | neu, 04:48:22 | **neu**, 04:48:22 — alle Typen |

Beim ersten blieben unveränderte Dateien liegen, beim zweiten bekam jede
Datei dieselbe neue Zeit, obwohl der Build sich nur in vier Kommentarzeilen
der `.htaccess` unterschied. Die frühere Fassung dieses Absatzes machte aus
der ersten Messung eine Regel («Plesk schreibt inkrementell»); die zweite
widerlegt sie. Ob geräumt oder überschrieben wird, entscheidet der Server,
und wir sehen es von aussen nicht.

Was daraus folgt, gilt in beide Richtungen:

- Ein **unverändertes** `last-modified` beweist nicht, dass der Deploy nicht
  lief — er kann nur nichts Sichtbares geändert haben.
- Ein **neues** `last-modified` beweist nicht, dass sich am Inhalt etwas
  geändert hat — am 30.08. wurde alles neu geschrieben, ohne dass ein Byte
  HTML anders war (`content-length` auf `/` blieb 55075).

Der belastbare Beleg ist der Inhalt, nicht der Zeitstempel: `content-length`
und ein Grep auf das, was neu sein soll. Und für das 403-Fenster, das ein
Leerräumen erzwingt (CLAUDE.md nennt es): am 30.08. spricht die
durchgehend gleiche mtime dafür, dass es eines gab — beobachtet haben wir
bisher keines, aber ausschliessen lässt es sich nicht.

## Was das nicht löst

Die **nginx-Direktiven** aus [`PLESK-NGINX.md`](PLESK-NGINX.md) bleiben
nötig. Sie sind Serverkonfiguration und liegen nicht in den Dateien — kein
Deployment bringt sie mit.

## Vorschau und Default-Branch

Die GitHub-Pages-Vorschau deployt nur vom **Default-Branch** des Repos. Das
ist keine Wahl, sondern eine Regel: das Environment `github-pages` beschraenkt
Deployments darauf, und ein Push auf einen anderen Branch scheitert am
Environment-Gate — ohne Log, in zwei Sekunden.

Solange der Default `claude/new-session-1fphb2` ist, zeigt die Vorschau also
diesen Branch. Nach dem Umstellen auf `main` folgt sie `main`. Der
Deploy-Branch fuer Plesk haengt dagegen fest an `main` und ist davon
unabhaengig.

## Wenn die Git-Extension fehlt

Manche Plesk-Pakete haben sie nicht installiert. Dann bleibt der Weg über das
Artefakt aus [`PLESK-BRIEFING.md`](PLESK-BRIEFING.md) — Abschnitt
*Aktualisieren, wenn der Code sich geändert hat*.

## Wenn der Pull scheitert: einmal neu klonen

Ein Plesk-Repo, das noch von einem der alten `--orphan`-Builds stammt, hat
eine Historie, die mit der jetzigen nichts gemeinsam hat. Weitere Pulls
scheitern weiter, auch nach dem Fix — die gemeinsame Basis fehlt eben.

Einmalig: das Repository im Git-Modul **entfernen und neu hinzufügen**
(gleiche Werte, Branch `deploy`). Das ist ein frischer Klon, danach sind alle
Aktualisierungen Fast-Forwards.

Erkennbar ist der Fall daran, dass Plesk denselben Commit weiter anzeigt,
obwohl auf GitHub ein neuerer steht — oder an einer Meldung mit
*unrelated histories* respektive *Not possible to fast-forward*.

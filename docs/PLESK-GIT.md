# Deploy über Plesks Git-Extension

Damit entfällt das Herunterladen, Leeren und Entpacken bei jeder Änderung.
Einmal einrichten, danach zieht Plesk den fertigen Stand selbst.

## Wie es funktioniert

Die CI baut bei jedem Push und schreibt **nur den Inhalt von `dist/`** auf
den Branch `deploy`. Der Branch enthält kein TypeScript, kein `node_modules`,
keine Konfiguration — genau das, was ins Webroot gehört: HTML, `_assets/`,
`fonts/`, `api/`, `.htaccess`, `404.html`, `robots.txt`, `sitemap.xml`.

```
Quellbranch  ──CI──▶  Branch deploy  ──Plesk Git──▶  httpdocs
```

Kein Node auf dem Server, kein Composer, kein Build beim Hoster.

Der Branch trägt bewusst keine Historie (`--orphan`, force-push): ein
Build-Ergebnis ist kein Quellcode, und ohne das würde das Repo mit jedem
Deploy um die vollen Assets wachsen.

Gebaut wird **nur beim Push auf den Default-Branch** des Repos. Das ist an
den Default gekoppelt und nicht an einen festen Namen: heute ist es
`claude/new-session-1fphb2`, nach dem Umstellen auf `main` folgt es dorthin,
ohne dass am Workflow etwas geändert werden muss. Zwei Quellen für denselben
Branch wären ein Wettlauf mit force-push.

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
# muss www enthalten
curl -s https://www.birkenhain.ch/ | grep -o 'rel="canonical" href="[^"]*"'

# muss 200 sein
curl -so /dev/null -w '%{http_code}\n' https://www.birkenhain.ch/architektur/

# muss 404 sein
curl -so /dev/null -w '%{http_code}\n' https://www.birkenhain.ch/api/lib/birkenhain.php

# muss 405 sein
curl -so /dev/null -w '%{http_code}\n' https://www.birkenhain.ch/api/anmeldung.php
```

## Was das nicht löst

Die **nginx-Direktiven** aus [`PLESK-NGINX.md`](PLESK-NGINX.md) bleiben
nötig. Sie sind Serverkonfiguration und liegen nicht in den Dateien — kein
Deployment bringt sie mit.

## Wenn die Git-Extension fehlt

Manche Plesk-Pakete haben sie nicht installiert. Dann bleibt der Weg über das
Artefakt aus [`PLESK-BRIEFING.md`](PLESK-BRIEFING.md) — Abschnitt
*Aktualisieren, wenn der Code sich geändert hat*.

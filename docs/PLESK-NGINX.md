# nginx-Direktiven für Plesk

**Stand 28.08.2026 12:40Z, live nachgemessen — und das Ergebnis ist ein
Befund:** auf `birkenhain.ch` trägt **keine einzige HTML-Seite** einen der
vier Sicherheits-Header. Nicht `/`, nicht `/architektur/`, nicht `/en/`, nicht
`/impressum/`. Was sie tragen, ist HSTS (das setzt Plesk selbst) und die
Cache-Regeln. Es fehlen:

```
x-content-type-options   referrer-policy   x-frame-options   content-security-policy
```

Vorhanden sind sie dort, wo **Apache** antwortet: `/robots.txt`,
`/sitemap.xml`, `/favicon.svg` und die Fehlerseite. Dort greift die
`public/.htaccess`, in der die vier Header stehen. Alles, was **nginx** selbst
ausliefert — HTML, CSS, JS, PNG, WOFF2, MP4 — geht ohne sie raus.

Nachzumessen mit einem Befehl:

```bash
npm run check:live-headers
```

Er fragt eine Auswahl von Pfaden ab, die die Aufteilung sichtbar macht, und
fällt, solange einer der fünf Header fehlt. Ein `curl -I` auf einen einzelnen
Pfad hätte den Befund nie gezeigt: er hängt am Dateityp, nicht an der Domain.
Genau daran ist die frühere Fassung dieses Dokuments gescheitert — sie hielt
den Block für aktiv, weil die Stichprobe zufällig ein Apache-Pfad war.

**Wer geantwortet hat, verrät der ETag.** Apache: Grösse in Hex, Bindestrich,
dann ein langer Block aus mtime und Inode (`"2c3-65a1aacc5021d"`), dazu
`x-accel-version`. nginx: acht Hex-Stellen mtime, Bindestrich, Grösse
(`"6a91805a-80f"`) — und für alle Dateien desselben Deploys derselbe erste
Block.

**Und eine Falle, die den Befund unsichtbar macht: GET und HEAD antworten
verschieden.** Nachgemessen am 30.08.2026 04:34Z, sechs Wiederholungen, jedes
Mal gleich — auf demselben Pfad:

| Anfrage | ETag auf `/` | Stack | Sicherheits-Header |
|---|---|---|---|
| `GET /` | `"6a919eda-d723"` | nginx | keiner |
| `HEAD /` | `"d723-65a1c7e23ff98"` | Apache | alle vier, CSP vollständig |

Plesk reicht den HEAD an Apache durch; den GET beantwortet nginx selbst. Das
gilt für **jeden** Pfad, den nginx ausliefert — `/`, `/architektur/`, `/en/`,
`/apple-touch-icon.png`, `/fonts/readex-pro-variable.woff2`,
`/media/movie.mp4`. Nur die Apache-eigenen Typen (`/robots.txt`,
`/favicon.svg`) antworten auf beides gleich.

Praktisch heisst das: **`curl -I https://birkenhain.ch/` gibt Entwarnung für
etwas, das im Browser nie ankommt.** Browser laden Seiten mit GET, und dort
fehlen die Header. Wer den Zustand von Hand nachsehen will, nimmt darum
`curl -sS -D- -o /dev/null`, nie `-I`. `check:live-headers` misst mit GET,
fragt jeden Pfad zusätzlich als HEAD ab und schreibt `taeuscht` in die
Spalte HEAD, wo die beiden auseinanderfallen — heute sechs von zehn.

Das ist auch die Erklärung dafür, wie der Befund so lange stehen konnte, ohne
aufzufallen: die naheliegendste Prüfung von Hand ist genau die, die ihn nicht
sieht.

**Was das praktisch heisst.** Ohne CSP auf den Seiten fehlt nicht nur eine
Zeile im Kopf: `frame-ancestors`, `object-src 'none'`, `base-uri` und
`form-action` sind auf den Seiten unwirksam, `x-frame-options` ebenso — die
Site ist einbettbar. Und `script-src 'self'`, das der Build mit
`npm run check:csp` und `vite.build.assetsInlineLimit: 0` bedient, wird auf
den Seiten derzeit **nicht durchgesetzt**. Der Build passt zur Policy; die
Policy kommt bei den Seiten nur nicht an. Die Reihenfolge ist damit richtig:
erst passt der Build, dann darf der Header zurück, ohne etwas zu brechen.

**Nur im Panel zu beheben.** Die `.htaccess` kann nichts dafür tun; nginx
liest sie nicht. Die Regeln unten müssen in die nginx-Direktiven, und dabei
zählt eine Eigenheit von nginx: **ein `location`-Block, der selbst ein
`add_header` setzt, erbt keines von aussen.** Jeder Block mit einem
`add_header Cache-Control` muss die Sicherheits-Header also wiederholen.
Genau dort fallen sie sonst weg.

**Auch HSTS ist inzwischen gesetzt** (nachgemessen 11:32Z), allerdings nicht
mit dem Wert aus der Direktive unten:

```
strict-transport-security: max-age=15768000; includeSubDomains
```

Das sind 182 Tage, nicht das dokumentierte Jahr — und damit vermutlich Plesks
eigene HSTS-Option, nicht dieser Block. Wer die Direktive unten anpasst und
sich wundert, dass der Wert gleich bleibt: die Einstellung im Panel gewinnt.
Der Header liegt auf Seiten, `/_assets/` und dem Endpoint.

Ein kleiner Rest bleibt: die 301 von `www.birkenhain.ch` trägt **keinen**
HSTS-Header. Weil `includeSubDomains` auf der Apex-Domain `www.` mitabdeckt,
greift der Schutz, sobald ein Browser die Apex-Domain einmal gesehen hat —
offen ist nur der allererste Aufruf, der über `http://www.` einsteigt. Wer das
schliessen will, setzt den Header auch im www-Vhost.

`preload` ist absichtlich nicht gesetzt: der Eintrag in die Browser-Liste ist
praktisch nicht zurücknehmbar, und die Site ist noch nicht einmal indexierbar.

**Warum es nötig ist:** nginx bedient die statischen Dateien selbst, und damit
wird die mitgelieferte `.htaccess` für sie **ignoriert**. Ohne die Regeln unten
fehlen:

| fehlte | Folge |
| --- | --- |
| Security-Header, CSP | keine Klickjacking- und MIME-Sniffing-Sperre |
| HSTS | erster Aufruf über HTTP bleibt angreifbar |
| `Cache-Control` auf `/_assets/` | gehashte Dateien werden bei jedem Besuch neu validiert |
| `ErrorDocument` | falsche URLs zeigen nginx' Standardseite statt der Projekt-404 |

Kompression läuft schon — nginx gzippt von selbst, das ist nachgemessen.

## Wohin

Plesk → *Websites & Domains* → Domain → **Apache & nginx Einstellungen** →
Feld **Zusätzliche nginx-Direktiven** → einfügen → *OK*.

Plesk prüft die Syntax beim Speichern. Wird die Eingabe abgelehnt, ist ein
Direktiv in dieser Plesk-Version nicht erlaubt — dann die betreffende Zeile
entfernen und erneut speichern, statt zu raten.

## Der Block

```nginx
# --- Security-Header -------------------------------------------------------
# In nginx erben location-Blöcke keine add_header-Direktiven, sobald sie
# selbst eine setzen. Deshalb stehen sie unten in JEDEM location-Block noch
# einmal — das ist keine Verdopplung aus Nachlässigkeit, sondern der Grund,
# warum am 28.08.2026 keine Seite eine CSP trug.
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Die Site lädt nichts von Dritten — ausser den OSM-Kartenausschnitten, und
# die erst nach ausdrücklicher Einwilligung.
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'" always;

# --- Fehlerseite -----------------------------------------------------------
error_page 404 /404.html;

# --- Caching ---------------------------------------------------------------
# Alles unter /_assets/ trägt einen Inhalts-Hash im Dateinamen: dieselbe URL
# liefert nie anderen Inhalt, also unbegrenzt cachebar.
location ^~ /_assets/ {
    expires max;
    add_header Cache-Control "public, immutable" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'" always;
}

location ^~ /fonts/ {
    expires 30d;
    add_header Cache-Control "public" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'" always;
    # Nicht erforderlich bei gleicher Origin — CORS greift nur cross-origin,
    # und Preload wie CSS-Abruf sind beide anonym. Live nachgemessen: die
    # Schrift laedt ohne diesen Header korrekt. Steht hier fuer den Fall
    # eines separaten Asset-Hosts.
    add_header Access-Control-Allow-Origin "*" always;
}

# HTML dagegen kurz: ein Deploy soll ankommen.
#
# Dieser Block ist der wichtigste der Datei — er greift auch für `/` und
# `/architektur/`, weil nginx beim Auflösen des Index intern auf
# `/index.html` umschreibt und die Location dann erneut wählt. Was hier
# fehlt, fehlt auf jeder Seite der Site.
location ~* \.html$ {
    expires 5m;
    add_header Cache-Control "public, must-revalidate" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'" always;
}

# Filme tragen keinen Hash im Namen — `immutable` würde einen Austausch bei
# wiederkehrenden Besuchern nie ankommen lassen. Eine Woche reicht. Dieselben
# Werte wie in der `.htaccess`, damit beide Wege dasselbe sagen.
location ~* \.(mp4|webm)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'" always;
}

# --- Nicht ausliefern -----------------------------------------------------
# Die gemeinsame PHP-Logik ist kein Einstiegspunkt. Sie ist zusätzlich im
# Code gesperrt (Konstante BIRKENHAIN_ENTRY), das hier ist die zweite Ebene.
location ^~ /api/lib/ {
    deny all;
    return 404;
}

# Punktdateien und die Datenbank, falls sie je im Webroot landet.
location ~ /\.(?!well-known) {
    deny all;
    return 404;
}

location ~* \.(sqlite|sqlite-wal|sqlite-shm)$ {
    deny all;
    return 404;
}
```

**Wenn im Panel schon andere Blöcke stehen:** dieselbe Regel gilt dort. Am
28.08.2026 trug `/apple-touch-icon.png` `cache-control: public, immutable`,
obwohl es nicht unter `/_assets/` liegt — es gibt also eine
Endungsliste im Panel, die dieser Block nicht kennt. Was dort ein
`add_header` setzt, braucht die fünf Header ebenfalls. Der Prüfbefehl unten
findet solche Blöcke, ohne dass man sie sehen muss: er zeigt, welcher
Dateityp ohne Header ausgeliefert wird.

## Danach prüfen

Zuerst der Befehl, der alles auf einmal abfragt — eine Seite allein genügt
nicht, weil je nach Dateityp nginx oder Apache antwortet:

```bash
npm run check:live-headers
```

Erwartet: «Alle 10 Antworten tragen die fuenf Header.» Solange eine Zeile
`nginx` in der Stack-Spalte und fehlende Header zeigt, greifen die Direktiven
für diesen Dateityp nicht.

Einzeln nachfassen:

```bash
# Security-Header müssen jetzt da sein — auf einer Seite, nicht auf robots.txt
curl -sI https://birkenhain.ch/ | grep -i "x-content-type\|strict-transport\|content-security"

# Assets müssen immutable sein
curl -sI https://birkenhain.ch/_assets/*.css | grep -i cache-control

# Die gemeinsame Logik muss 404 liefern, nicht 200
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/api/lib/birkenhain.php

# Eine falsche URL muss die Projekt-404 zeigen, nicht nginx'
curl -s https://birkenhain.ch/gibt-es-nicht | grep -o "Seite nicht gefunden"

# Der Endpoint muss weiter 405 auf GET liefern
curl -so /dev/null -w '%{http_code}\n' https://birkenhain.ch/api/anmeldung.php
```

## Zwei bewusste Einschränkungen

**Englische 404.** `error_page` gilt hier für die ganze Domain, EN-Besucher
sehen also die deutsche Fehlerseite. Eine sprachabhängige Fehlerseite
braucht in nginx einen benannten Location-Block und sollte getestet werden,
bevor sie live geht — das ist mehr als ein Copy-Paste und deshalb hier nicht
enthalten.

**`style-src 'unsafe-inline'`.** Astro inlinet kleine Stylesheets in den
`<head>`. Ohne `'unsafe-inline'` würden sie blockiert. Wer das schliessen
will, muss `inlineStylesheets: 'never'` in `astro.config.mjs` setzen — dann
kostet es einen zusätzlichen Request im ersten Seitenaufbau.

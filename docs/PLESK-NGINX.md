# nginx-Direktiven für Plesk

**Stand 24.08.2026, live nachgemessen:** die Direktiven unten sind auf
`birkenhain.ch` **aktiv**. Der Server antwortet mit `x-content-type-options`,
`referrer-policy`, `x-frame-options` und der vollen CSP; `/_assets/` liefert
`cache-control: public, immutable` mit einem Jahr `expires`, das HTML
`public, must-revalidate` mit fünf Minuten. `/api/lib/birkenhain.php`
antwortet 404. Diese Datei ist damit von der Anleitung zur Referenz
geworden — sie dokumentiert, was gesetzt ist.

**Ein Punkt fehlt weiterhin:** `strict-transport-security` erscheint in
keiner Antwort, obwohl die Direktive unten steht. Zu prüfen, in dieser
Reihenfolge, statt zu raten:

1. Ob der Block wirklich in **beiden** Vhosts steht — `birkenhain.ch` und
   `www.birkenhain.ch` sind in Plesk getrennte Einträge.
2. Ob Plesk unter *Hosting & DNS → Hosting-Einstellungen* eine eigene
   HSTS-Option führt, die die manuelle Direktive überschreibt.
3. Ob ein `add_header` weiter oben ohne `always` steht — dann verliert der
   Block bei 301/304-Antworten alle Header darüber.

Bis das geklärt ist, bleibt der erste Aufruf über `http://` angreifbar. Alles
andere ist gesetzt.

**Warum es nötig war:** nginx bedient die statischen Dateien selbst, und damit
wird die mitgelieferte `.htaccess` **ignoriert**. Ohne die Regeln unten fehlten:

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
# selbst eine setzen. Deshalb stehen sie unten in der Asset-Location noch
# einmal — das ist keine Verdopplung aus Nachlässigkeit.
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
}

location ^~ /fonts/ {
    expires 30d;
    add_header Cache-Control "public" always;
    # Nicht erforderlich bei gleicher Origin — CORS greift nur cross-origin,
    # und Preload wie CSS-Abruf sind beide anonym. Live nachgemessen: die
    # Schrift laedt ohne diesen Header korrekt. Steht hier fuer den Fall
    # eines separaten Asset-Hosts.
    add_header Access-Control-Allow-Origin "*" always;
}

# HTML dagegen kurz: ein Deploy soll ankommen.
location ~* \.html$ {
    expires 5m;
    add_header Cache-Control "public, must-revalidate" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
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

## Danach prüfen

```bash
# Security-Header müssen jetzt da sein
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

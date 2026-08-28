#!/usr/bin/env bash
#
# Prueft die Sicherheits-Header an der ausgelieferten Site — dort, wo sie
# wirken, nicht dort, wo sie geschrieben stehen.
#
# Der Anlass: `public/.htaccess` setzt vier Header (X-Content-Type-Options,
# Referrer-Policy, X-Frame-Options, Content-Security-Policy). Auf
# birkenhain.ch beantwortet nginx die haeufigen Dateitypen selbst und liest
# die .htaccess dabei nie — HTML eingeschlossen. Am 28.08.2026 gemessen:
# `/robots.txt` und `/favicon.svg` trugen alle vier, jede HTML-Seite keinen
# einzigen. Ein `curl -I` auf einen beliebigen Pfad kann das nicht sehen; es
# haengt am Dateityp, nicht an der Domain. Darum diese Liste.
#
# Woran man erkennt, wer geantwortet hat: Apache-Antworten tragen
# `x-accel-version` und ein ETag aus Groesse und einem langen mtime-Inode-Block
# ("2c3-65a1aacc5021d"); nginx-Antworten kein x-accel-version und ein ETag aus
# acht Hex-Stellen mtime plus Groesse ("6a91805a-80f") — bei allen Dateien
# desselben Deploys mit demselben ersten Block.
#
# Aufruf:  bash scripts/check-live-headers.sh [basis-url]
set -u

BASIS="${1:-https://birkenhain.ch}"
PFLICHT=(x-content-type-options referrer-policy x-frame-options content-security-policy strict-transport-security)

# Repraesentativ, nicht vollstaendig: je eine Seite, ein Asset, eine Schrift,
# ein Bild, ein Film, eine Textdatei, eine Fehlerseite. Genau die Vielfalt,
# an der die Aufteilung zwischen nginx und Apache sichtbar wird.
PFADE=(/ /architektur/ /en/ /impressum/ /robots.txt /sitemap.xml /favicon.svg /apple-touch-icon.png /fonts/readex-pro-variable.woff2 /gibt-es-nicht)

fehler=0
printf '%-40s %-7s %-8s %s\n' 'Pfad' 'Status' 'Stack' 'fehlende Header'
printf '%s\n' '---------------------------------------------------------------------------------'

for pfad in "${PFADE[@]}"; do
  kopf=$(curl -sS -D- -o /dev/null -m 60 "$BASIS$pfad" 2>/dev/null)
  status=$(printf '%s' "$kopf" | grep -oE '^HTTP/[0-9.]+ [0-9]{3}' | tail -1 | grep -oE '[0-9]{3}$')
  # Wer geantwortet hat, verraet der ETag. Apache: Groesse-Hex, Bindestrich,
  # dann ein langer Block aus mtime und Inode. nginx: acht Hex-Stellen mtime,
  # Bindestrich, Groesse — und fuer alle Dateien desselben Deploys derselbe
  # erste Block. Dynamische Antworten (die Fehlerseite) tragen keinen ETag;
  # dort bleibt die Spalte leer, statt zu raten.
  etag=$(printf '%s' "$kopf" | grep -i '^etag:' | tr -d '\r' | sed 's/.*"\(.*\)".*/\1/')
  if printf '%s' "$kopf" | grep -qi '^x-accel-version:'; then stack=apache
  elif printf '%s' "$etag" | grep -qE '^[0-9a-f]+-[0-9a-f]{9,}$'; then stack=apache
  elif printf '%s' "$etag" | grep -qE '^[0-9a-f]{8}-[0-9a-f]+$'; then stack=nginx
  else stack='?'; fi

  fehlt=()
  for h in "${PFLICHT[@]}"; do
    printf '%s' "$kopf" | grep -qi "^$h:" || fehlt+=("$h")
  done

  if [ ${#fehlt[@]} -gt 0 ]; then fehler=$((fehler + 1)); fi
  printf '%-40s %-7s %-8s %s\n' "$pfad" "${status:-?}" "$stack" "$(IFS=', '; echo "${fehlt[*]:-—}")"
done

# Informativ, nicht Pflicht: Permissions-Policy steht im nginx-Block in
# docs/PLESK-NGINX.md, aber nicht in der .htaccess. Solange sie nicht in der
# Quelle im Repo steht, ist ihr Fehlen kein Fehler, nur eine Notiz.
if ! curl -sS -D- -o /dev/null -m 60 "$BASIS/" 2>/dev/null | grep -qi '^permissions-policy:'; then
  echo
  echo "Notiz: Permissions-Policy fehlt auf / — im nginx-Block dokumentiert, in der .htaccess nicht."
fi

echo
if [ "$fehler" -gt 0 ]; then
  echo "::error title=Sicherheits-Header fehlen live::$fehler von ${#PFADE[@]} Antworten fehlt mindestens ein Pflicht-Header."
  echo "Wo 'nginx' steht, hat nginx die Datei selbst ausgeliefert — die .htaccess greift dort nicht."
  echo "Die Regeln gehoeren dann in die nginx-Direktiven: docs/PLESK-NGINX.md."
  exit 1
fi
echo "Alle ${#PFADE[@]} Antworten tragen die fuenf Header."

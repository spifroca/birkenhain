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
# Gemessen wird mit GET, und das ist keine Nebensache: auf birkenhain.ch
# antworten GET und HEAD auf demselben Pfad aus verschiedenen Haeusern. Ein
# HEAD auf `/` reicht Plesk an Apache durch — Antwort mit allen vier Headern
# und Apache-ETag. Der GET, den jeder Browser schickt, kommt von nginx: ohne
# die Header. `curl -I https://birkenhain.ch/` meldet also Entwarnung fuer
# etwas, das im Browser nie ankommt. Die Spalte HEAD unten macht genau diese
# Luecke sichtbar, statt sie zu verschweigen.
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
taeuscht=0
printf '%-40s %-7s %-8s %-9s %s\n' 'Pfad' 'Status' 'Stack' 'HEAD' 'fehlende Header (GET)'
printf '%s\n' '-------------------------------------------------------------------------------------------'

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

  # Derselbe Pfad, einmal als HEAD. Wo die Antwort dann ploetzlich vollstaendig
  # ist, hat Plesk sie an Apache durchgereicht — und ein `curl -I` wuerde hier
  # Entwarnung geben, die der Browser nie zu sehen bekommt.
  kopf_head=$(curl -sS -I -D- -o /dev/null -m 60 "$BASIS$pfad" 2>/dev/null)
  fehlt_head=0
  for h in "${PFLICHT[@]}"; do
    printf '%s' "$kopf_head" | grep -qi "^$h:" || fehlt_head=$((fehlt_head + 1))
  done
  if [ ${#fehlt[@]} -gt 0 ] && [ "$fehlt_head" -eq 0 ]; then
    spalte_head='taeuscht'; taeuscht=$((taeuscht + 1))
  elif [ "$fehlt_head" -gt 0 ]; then
    spalte_head='fehlt'
  else
    spalte_head='ok'
  fi

  if [ ${#fehlt[@]} -gt 0 ]; then fehler=$((fehler + 1)); fi
  printf '%-40s %-7s %-8s %-9s %s\n' "$pfad" "${status:-?}" "$stack" "$spalte_head" "$(IFS=', '; echo "${fehlt[*]:-—}")"
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
  if [ "$taeuscht" -gt 0 ]; then
    echo
    echo "Achtung, $taeuscht Pfad(e) mit 'taeuscht': dort antwortet HEAD vollstaendig, GET nicht."
    echo "Plesk reicht den HEAD an Apache durch, den GET beantwortet nginx selbst. Ein"
    echo "'curl -I' meldet dort Entwarnung fuer etwas, das im Browser nie ankommt — nur der"
    echo "GET zaehlt. Deshalb misst diese Pruefung mit GET."
  fi
  exit 1
fi
echo "Alle ${#PFADE[@]} Antworten tragen die fuenf Header."

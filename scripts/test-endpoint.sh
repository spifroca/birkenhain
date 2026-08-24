#!/usr/bin/env bash
#
# Testet den Anmeldeformular-Endpoint gegen PHPs eingebauten Server.
# Kein Mailversand: die Konfiguration nutzt mail_transport = log.
#
#   ./scripts/test-endpoint.sh
#
set -euo pipefail

PORT="${PORT:-8199}"
TMP="$(mktemp -d)"
ROOT="$TMP/webroot"
DATA="$TMP/birkenhain-data"
FAILED=0

cleanup() {
  [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

mkdir -p "$ROOT" "$DATA"
cp -r public/api "$ROOT/"

cat > "$DATA/config.php" <<PHP
<?php
return [
    'opt_in_secret' => 'test-secret-mit-mehr-als-32-zeichen-laenge-xxxx',
    'mail_from' => 'Im Birkenhain <noreply@example.test>',
    'mail_notify_to' => 'intern@example.test',
    'mail_transport' => 'log',
    'site_origin' => 'http://127.0.0.1:$PORT',
];
PHP

BIRKENHAIN_DATA_DIR="$DATA" php -S "127.0.0.1:$PORT" -t "$ROOT" >"$TMP/server.log" 2>&1 &
SRV=$!

for _ in $(seq 1 40); do
  curl -s --noproxy '*' -o /dev/null "http://127.0.0.1:$PORT/api/anmeldung.php" && break
  sleep 0.2
done

post() { curl -s --noproxy '*' -H 'Accept: application/json' "$@" "http://127.0.0.1:$PORT/api/anmeldung.php"; }
code() { curl -s --noproxy '*' -o /dev/null -w '%{http_code}' "$@"; }
target() { curl -s --noproxy '*' -o /dev/null -w '%{redirect_url}' "$@"; }
rows() { php -r "\$d=new PDO('sqlite:$DATA/anmeldungen.sqlite');echo \$d->query('SELECT COUNT(*) FROM $1')->fetchColumn();" 2>/dev/null || echo 0; }

check() {
  if [ "$2" = "$3" ]; then
    printf '  ok    %s\n' "$1"
  else
    printf '  FAIL  %s\n        erwartet: %s\n        erhalten: %s\n' "$1" "$3" "$2"
    FAILED=$((FAILED + 1))
  fi
}

echo "Endpoint-Tests"

check "GET wird abgewiesen" \
  "$(code "http://127.0.0.1:$PORT/api/anmeldung.php")" "405"

check "lib/ ist nicht direkt ausführbar oder leer" \
  "$(curl -s --noproxy '*' "http://127.0.0.1:$PORT/api/lib/birkenhain.php" | head -c 5)" ""

check "fehlendes Consent" \
  "$(post -d firstName=A -d lastName=B -d email=a@example.test -d locale=de)" \
  '{"ok":false,"fields":{"consent":"required"}}'

check "ungültige Adresse" \
  "$(post -d firstName=A -d lastName=B -d email=kaputt -d consent=on -d locale=de)" \
  '{"ok":false,"fields":{"email":"invalid"}}'

check "fehlender Name" \
  "$(post -d lastName=B -d email=a@example.test -d consent=on -d locale=de)" \
  '{"ok":false,"fields":{"firstName":"required"}}'

check "Honeypot meldet Erfolg" \
  "$(post -d firstName=Bot -d lastName=Bot -d email=bot@example.test -d consent=on -d website=spam -d locale=de)" \
  '{"ok":true}'
check "Honeypot legt nichts an" "$(rows pending)" "0"

check "gültige Anmeldung ohne JS" \
  "$(target -d firstName=Anna -d lastName=Muster -d email=anna@example.test -d rooms=3.5 \
      -d moveIn=2027-04 -d consent=on -d locale=de "http://127.0.0.1:$PORT/api/anmeldung.php")" \
  "http://127.0.0.1:$PORT/anmeldung/gesendet"
check "unbestätigte Anmeldung liegt vor" "$(rows pending)" "1"

LINK=$(grep -o "http://127.0.0.1:$PORT/api/bestaetigen.php?[^ ]*" "$DATA/mail.log" | tail -1)
ID=$(printf '%s' "$LINK" | sed 's/.*id=\([^&]*\).*/\1/')

check "gefälschte Signatur" \
  "$(target "http://127.0.0.1:$PORT/api/bestaetigen.php?id=$ID&sig=gefaelscht")" \
  "http://127.0.0.1:$PORT/anmeldung/bestaetigung-fehlgeschlagen"
check "unbestätigte Anmeldung unberührt" "$(rows pending)" "1"

check "echter Bestätigungslink" "$(target "$LINK")" \
  "http://127.0.0.1:$PORT/anmeldung/bestaetigt"
check "Anmeldung ist bestätigt" "$(rows signups)" "1"
check "offene Anmeldung eingelöst" "$(rows pending)" "0"

check "Replay desselben Links" "$(target "$LINK")" \
  "http://127.0.0.1:$PORT/anmeldung/bestaetigung-fehlgeschlagen"

check "bekannte Adresse verrät sich nicht" \
  "$(post -d firstName=Anna -d lastName=Muster -d email=anna@example.test -d consent=on -d locale=de)" \
  '{"ok":true}'
check "und legt nichts Neues an" "$(rows pending)" "0"

check "EN-Locale trifft englische Statusseite" \
  "$(target -d firstName=Jane -d lastName=Doe -d email=jane@example.test -d consent=on \
      -d locale=en "http://127.0.0.1:$PORT/api/anmeldung.php")" \
  "http://127.0.0.1:$PORT/en/register/sent"

# Zaehler stehen jetzt bei 3 gezaehlten Versuchen; bis 10 sind es sieben.
last=""
for n in $(seq 1 9); do
  last=$(code -H 'Accept: application/json' -d "firstName=T$n" -d lastName=M \
    -d "email=t$n@example.test" -d consent=on -d locale=de "http://127.0.0.1:$PORT/api/anmeldung.php")
done
check "Rate-Limit greift pro IP" "$last" "429"

echo
if [ "$FAILED" -eq 0 ]; then
  echo "alle Tests bestanden"
else
  echo "$FAILED Test(s) fehlgeschlagen"
  exit 1
fi

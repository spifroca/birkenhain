# Arbeitsweise in diesem Repo

## Deploy läuft automatisch

Jeder Merge auf `main` geht von selbst live:

```
main → CI baut → schreibt deploy-Branch → ruft Plesk-Webhook → Server zieht
```

Der Webhook hängt am Secret `PLESK_DEPLOY_HOOK`. Fehlt es, überspringt der
Schritt sich selbst und sagt es im Log; antwortet Plesk nicht mit 2xx, fällt
der Job. Ein Deploy von Hand ist über *Actions → CI → Run workflow* möglich —
dort muss `main` gewählt werden, weil der Default-Branch noch der alte
Arbeitsbranch ist.

Kein Klick in Plesk, kein Klick in GitHub nötig. Nach dem Merge prüfen:
`last-modified` auf `https://birkenhain.ch/` und eine Datei, die neu ist.

**Bekannte Nebenwirkung:** Plesk räumt beim Deploy den Zielordner, bevor es
schreibt. Für ein bis wenige Minuten antwortet die Seite mit 403. Kein
Defekt — behebbar nur serverseitig über «Zusätzliche Deployment-Aktionen»
(in ein neues Verzeichnis schreiben, per Symlink umschalten).

## Erwartungen an die Kommunikation

- Kurz antworten. Kein Nacherzählen von Zwischenschritten.
- Nur fragen, was wirklich eine Entscheidung braucht; sonst entscheiden und
  es beim Ergebnis sagen.
- So weit wie möglich selbst zu Ende bringen: bauen, prüfen, mergen, Live-
  Stand verifizieren — ohne Rückfrage dazwischen.

## Was nicht ohne Freigabe passiert

- `features.indexable` auf `true` (Suchmaschinen-Freigabe) — erst nach der
  juristischen Prüfung von Impressum und Datenschutz.
- Mietpreise und Vermietungsstart publizieren.
- Projektfakten erfinden: die Zahlen stehen in `src/data/`, `check:data`
  erzwingt sie.

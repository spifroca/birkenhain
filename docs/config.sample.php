<?php

/**
 * Konfiguration des Anmeldeformulars.
 *
 * Diese Datei gehört NICHT ins Webroot. Sie liegt neben der Datenbank in
 * `birkenhain-data/` — eine Ebene über dem Webroot, damit sie auch bei einer
 * Fehlkonfiguration von PHP nicht ausgeliefert werden kann.
 *
 * Kopieren nach: <über dem Webroot>/birkenhain-data/config.php
 */

return [
    // Signiert die Double-Opt-In-Links. Mindestens 32 Zeichen.
    // Erzeugen mit: openssl rand -base64 48
    'opt_in_secret' => '',

    // Absender der Bestätigungsmail. Muss eine Adresse der eigenen Domain
    // sein, damit SPF und DKIM des Hosters greifen.
    'mail_from' => 'Im Birkenhain <noreply@birkenhain.ch>',

    // Interne Benachrichtigung nach bestätigter Anmeldung. Leer lassen,
    // wenn keine gewünscht ist.
    'mail_notify_to' => '',

    // 'mail' = Mailserver des Hosters (Produktion).
    // 'log'  = nichts senden, nur nach birkenhain-data/mail.log schreiben.
    'mail_transport' => 'mail',

    // Absolute Basis-URL. Leer lassen, dann wird sie aus dem Request
    // abgeleitet — gesetzt ist sie verlässlicher, besonders hinter Proxies.
    //
    // ACHTUNG: Hieraus wird der Double-Opt-In-Link gebaut. Steht hier die
    // falsche Domain, zeigen die Bestätigungslinks ins Leere und es wird
    // nie eine Anmeldung gespeichert. Vor dem Livegang einmal prüfen.
    'site_origin' => 'https://birkenhain.ch',
];

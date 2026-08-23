import type { Env, Locale } from './env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Mailversand. Nur der eigene Versanddienst wird angesprochen — die
 * Anmeldedaten gehen an keinen weiteren Empfaenger. Ohne konfigurierten
 * Provider wird nichts verschickt und der Aufruf schlaegt fehl, statt
 * still zu verschwinden.
 */
export async function sendMail(env: Env, message: MailMessage): Promise<void> {
  const provider = env.MAIL_PROVIDER ?? 'resend';
  const from = env.MAIL_FROM;

  if (!from) throw new Error('MAIL_FROM ist nicht gesetzt.');

  if (provider === 'console') {
    // Nur fuer die lokale Entwicklung.
    console.log('[mail]', JSON.stringify({ ...message, from }));
    return;
  }

  if (provider !== 'resend') {
    throw new Error(`Unbekannter MAIL_PROVIDER: ${provider}`);
  }
  if (!env.MAIL_API_KEY) throw new Error('MAIL_API_KEY ist nicht gesetzt.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.MAIL_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mailversand fehlgeschlagen: ${response.status}`);
  }
}

const OPT_IN = {
  de: {
    subject: 'Bitte bestätigen Sie Ihre Anmeldung — Im Birkenhain',
    body: (name: string, link: string) =>
      [
        `Guten Tag ${name}`,
        '',
        'Sie haben sich für die Anmeldeliste der Wohnüberbauung Im Birkenhain',
        'in Rudolfstetten-Friedlisberg eingetragen. Bitte bestätigen Sie Ihre',
        'E-Mail-Adresse über den folgenden Link:',
        '',
        link,
        '',
        'Der Link ist sieben Tage gültig. Ohne Bestätigung wird Ihre Anmeldung',
        'nicht weiterverarbeitet und automatisch gelöscht.',
        '',
        'Haben Sie sich nicht angemeldet, ignorieren Sie diese Nachricht.',
        '',
        'Freundliche Grüsse',
        'Im Birkenhain',
      ].join('\n'),
  },
  en: {
    subject: 'Please confirm your registration — Im Birkenhain',
    body: (name: string, link: string) =>
      [
        `Hello ${name}`,
        '',
        'You have joined the registration list for the Im Birkenhain residential',
        'development in Rudolfstetten-Friedlisberg. Please confirm your email',
        'address using the following link:',
        '',
        link,
        '',
        'The link is valid for seven days. Without confirmation your registration',
        'is not processed further and is deleted automatically.',
        '',
        'If you did not register, please ignore this message.',
        '',
        'Kind regards',
        'Im Birkenhain',
      ].join('\n'),
  },
} as const;

export function optInMail(locale: Locale, name: string, link: string): Omit<MailMessage, 'to'> {
  const template = OPT_IN[locale];
  return { subject: template.subject, text: template.body(name, link) };
}

/** Interne Benachrichtigung an die Bewirtschaftung, erst nach Bestaetigung. */
export function notifyMail(record: Record<string, unknown>): Omit<MailMessage, 'to'> {
  const lines = Object.entries(record)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${String(value)}`);

  return {
    subject: 'Neue bestätigte Anmeldung — Im Birkenhain',
    text: ['Eine Anmeldung wurde per Double-Opt-In bestätigt.', '', ...lines].join('\n'),
  };
}

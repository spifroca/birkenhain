import { hashEmail, sign } from '../_lib/crypto';
import { normalizeLocale, statusUrl, type Env } from '../_lib/env';
import { optInMail, sendMail } from '../_lib/mail';
import { checkRateLimit, clientIp } from '../_lib/ratelimit';
import { isBot, validate } from '../_lib/validate';

const PENDING_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * POST /api/anmeldung
 *
 * Nimmt die Anmeldung an, prueft sie serverseitig, legt sie unbestaetigt ab
 * und verschickt die Double-Opt-In-Mail. Erst der Klick auf den Link in der
 * Mail macht daraus eine Anmeldung (siehe api/anmeldung/bestaetigen).
 *
 * Antwortet je nach `Accept` mit JSON (fetch aus dem Formular) oder mit einer
 * Redirect auf eine statische Statusseite (Formular ohne JS).
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(request, env, 'de', 'error', wantsJson, 400, { error: 'bad-request' });
  }

  const locale = normalizeLocale(form.get('locale'));

  // Honeypot: still verwerfen und Erfolg melden, damit Bots nichts lernen.
  if (isBot(form)) {
    return respond(request, env, locale, 'sent', wantsJson, 200, { ok: true });
  }

  const { ok, fields, value } = validate(form);
  if (!ok) {
    return respond(request, env, locale, 'error', wantsJson, 422, { ok: false, fields });
  }

  const secret = env.OPT_IN_SECRET;
  if (!secret || secret.length < 32) {
    console.error('OPT_IN_SECRET fehlt oder ist zu kurz.');
    return respond(request, env, locale, 'error', wantsJson, 500, { error: 'misconfigured' });
  }

  const emailHash = await hashEmail(value.email, secret);
  const rate = await checkRateLimit(env, clientIp(request), emailHash);
  if (!rate.allowed) {
    return respond(request, env, locale, 'rateLimit', wantsJson, 429, { error: 'rate-limit' });
  }

  // Bereits bestaetigte Adressen nicht erneut anschreiben, aber auch nicht
  // verraten, dass sie bekannt sind.
  if ((await env.BIRKENHAIN_KV.get(`signup:${emailHash}`)) !== null) {
    return respond(request, env, locale, 'sent', wantsJson, 200, { ok: true });
  }

  const id = crypto.randomUUID();
  const record = {
    ...value,
    createdAt: new Date().toISOString(),
    emailHash,
  };

  try {
    await env.BIRKENHAIN_KV.put(`pending:${id}`, JSON.stringify(record), {
      expirationTtl: PENDING_TTL_SECONDS,
    });

    const signature = await sign(id, secret);
    const origin = env.PUBLIC_SITE_ORIGIN ?? new URL(request.url).origin;
    const link = new URL('/api/anmeldung/bestaetigen', origin);
    link.searchParams.set('id', id);
    link.searchParams.set('sig', signature);

    const template = optInMail(locale, value.firstName, link.toString());
    await sendMail(env, { to: value.email, ...template });
  } catch (error) {
    console.error('Anmeldung fehlgeschlagen:', error);
    // Halb angelegte Anmeldung nicht liegen lassen.
    await env.BIRKENHAIN_KV.delete(`pending:${id}`).catch(() => undefined);
    return respond(request, env, locale, 'error', wantsJson, 502, { error: 'mail-failed' });
  }

  return respond(request, env, locale, 'sent', wantsJson, 200, { ok: true });
};

function respond(
  request: Request,
  env: Env,
  locale: 'de' | 'en',
  kind: 'sent' | 'error' | 'rateLimit',
  wantsJson: boolean,
  status: number,
  payload: Record<string, unknown>,
): Response {
  if (wantsJson) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  return Response.redirect(statusUrl(request, env, locale, kind), 303);
}

import { verify } from '../../_lib/crypto';
import { normalizeLocale, statusUrl, type Env } from '../../_lib/env';
import { notifyMail, sendMail } from '../../_lib/mail';
import type { Submission } from '../../_lib/validate';

interface PendingRecord extends Submission {
  createdAt: string;
  emailHash: string;
}

/**
 * GET /api/anmeldung/bestaetigen?id=…&sig=…
 *
 * Zweiter Schritt des Double-Opt-In. Die Signatur bindet die ID an das
 * Projektgeheimnis, damit fremde IDs nicht durchprobiert werden koennen.
 * Die E-Mail-Adresse steht nicht im Link.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  const signature = url.searchParams.get('sig') ?? '';
  const secret = env.OPT_IN_SECRET;

  const fail = (locale: 'de' | 'en') =>
    Response.redirect(statusUrl(request, env, locale, 'confirmFailed'), 303);

  if (!secret || id === '' || signature === '') return fail('de');
  if (!(await verify(id, signature, secret))) return fail('de');

  const raw = await env.BIRKENHAIN_KV.get(`pending:${id}`);
  // Abgelaufen oder schon eingeloest: derselbe Ausgang, keine Auskunft.
  if (raw === null) return fail('de');

  let record: PendingRecord;
  try {
    record = JSON.parse(raw) as PendingRecord;
  } catch {
    return fail('de');
  }

  const locale = normalizeLocale(record.locale);

  try {
    await env.BIRKENHAIN_KV.put(
      `signup:${record.emailHash}`,
      JSON.stringify({ ...record, confirmedAt: new Date().toISOString() }),
    );
    // Einmal-Link: nach dem Einloesen ist die offene Anmeldung weg.
    await env.BIRKENHAIN_KV.delete(`pending:${id}`);

    if (env.MAIL_NOTIFY_TO) {
      const { emailHash: _hash, ...data } = record;
      await sendMail(env, { to: env.MAIL_NOTIFY_TO, ...notifyMail(data) });
    }
  } catch (error) {
    console.error('Bestaetigung fehlgeschlagen:', error);
    return fail(locale);
  }

  return Response.redirect(statusUrl(request, env, locale, 'confirmed'), 303);
};

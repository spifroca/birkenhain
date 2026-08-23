import type { Env } from './env';

const WINDOW_SECONDS = 3600;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

export interface RateVerdict {
  allowed: boolean;
  reason?: 'ip' | 'email';
}

/**
 * Fixed-Window-Rate-Limit auf KV. Zaehlt pro IP und pro E-Mail-Hash, beide
 * Zaehler laufen nach einer Stunde ab. Bewusst schlicht: es geht um
 * Formular-Spam, nicht um exakte Quoten.
 */
export async function checkRateLimit(
  env: Env,
  ip: string,
  emailHash: string,
): Promise<RateVerdict> {
  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);

  if ((await bump(env, `rl:ip:${ip}:${window}`)) > MAX_PER_IP) {
    return { allowed: false, reason: 'ip' };
  }
  if ((await bump(env, `rl:mail:${emailHash}:${window}`)) > MAX_PER_EMAIL) {
    return { allowed: false, reason: 'email' };
  }
  return { allowed: true };
}

async function bump(env: Env, key: string): Promise<number> {
  const next = Number((await env.BIRKENHAIN_KV.get(key)) ?? '0') + 1;
  await env.BIRKENHAIN_KV.put(key, String(next), { expirationTtl: WINDOW_SECONDS });
  return next;
}

/** Client-IP hinter dem Cloudflare-Proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('cf-connecting-ip') ?? forwarded ?? 'unknown';
}

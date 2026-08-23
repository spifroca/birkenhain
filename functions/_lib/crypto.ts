const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Signatur fuer den Double-Opt-In-Link. */
export async function sign(value: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(value));
  return base64url(signature);
}

/** Vergleich in konstanter Zeit — kein Frueh-Abbruch beim ersten Unterschied. */
export async function verify(value: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(value, secret);
  if (expected.length !== signature.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/** E-Mail-Adressen werden nur als Hash indexiert, nicht als Klartext-Key. */
export async function hashEmail(email: string, secret: string): Promise<string> {
  return sign(email.toLowerCase(), secret);
}

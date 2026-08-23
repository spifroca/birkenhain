export interface Submission {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rooms: string;
  moveIn: string;
  message: string;
  consent: boolean;
  locale: 'de' | 'en';
}

export interface ValidationResult {
  ok: boolean;
  /** Feldname -> Fehlercode. Die Texte liegen im Frontend, nicht hier. */
  fields: Record<string, string>;
  value: Submission;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROOMS = /^\d(?:\.\d)?$/;
const MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/;

const LIMITS = {
  name: 80,
  email: 254,
  phone: 40,
  message: 2000,
} as const;

const TAB = 9;
const LF = 10;
const CR = 13;
const SPACE = 32;
const DEL = 127;

/**
 * Steuerzeichen entfernen. Tab und Zeilenumbruch bleiben, damit Freitext
 * mehrzeilig sein darf; alles andere unter 0x20 und 0x7f fliegt raus.
 */
function stripControl(value: string): string {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const keep = code === TAB || code === LF || code === CR || (code >= SPACE && code !== DEL);
    if (keep) out += char;
  }
  return out;
}

function text(form: FormData, name: string, max: number): string {
  const raw = form.get(name);
  if (typeof raw !== 'string') return '';
  return stripControl(raw).trim().slice(0, max);
}

/**
 * Serverseitige Validierung. Verbindlich — die Prüfung im Browser ist nur
 * Bequemlichkeit und kann fehlen oder umgangen werden.
 */
export function validate(form: FormData): ValidationResult {
  const value: Submission = {
    firstName: text(form, 'firstName', LIMITS.name),
    lastName: text(form, 'lastName', LIMITS.name),
    email: text(form, 'email', LIMITS.email).toLowerCase(),
    phone: text(form, 'phone', LIMITS.phone),
    rooms: text(form, 'rooms', 8),
    moveIn: text(form, 'moveIn', 16),
    message: text(form, 'message', LIMITS.message),
    consent: form.get('consent') !== null,
    locale: form.get('locale') === 'en' ? 'en' : 'de',
  };

  const fields: Record<string, string> = {};

  if (value.firstName === '') fields.firstName = 'required';
  if (value.lastName === '') fields.lastName = 'required';
  if (value.email === '' || !EMAIL.test(value.email)) fields.email = 'invalid';
  if (!value.consent) fields.consent = 'required';

  // Freiwillige Felder: unplausible Werte werden verworfen, nicht abgelehnt.
  if (value.rooms !== '' && !ROOMS.test(value.rooms)) value.rooms = '';
  if (value.moveIn !== '' && !MONTH.test(value.moveIn)) value.moveIn = '';

  return { ok: Object.keys(fields).length === 0, fields, value };
}

/** Honeypot: das Feld ist für Menschen unsichtbar und muss leer bleiben. */
export function isBot(form: FormData): boolean {
  const trap = form.get('website');
  return typeof trap === 'string' && trap.trim() !== '';
}

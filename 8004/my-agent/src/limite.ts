// Limite por IP en memoria: frena rafagas y abuso casual, no un ataque decidido
// (se reinicia en cada instancia nueva y no se comparte entre regiones).
import { createHmac } from 'crypto';

type Uso = { dia: string; n: number; min: number; ultimo: number };

const contadores = new Map<string, Uso>();

export function ipDe(req: any): string {
  const f = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(f) ? f[0] : String(f || '');
  return raw.split(',')[0].trim() || 'desconocida';
}

// Hash corto para contar unicos sin guardar la IP. IPv4 es espacio chico:
// no es anonimato fuerte, solo evita guardar la direccion en claro.
export function huella(ip: string): string {
  const sal = process.env.LOG_SALT || 'entropia';
  return createHmac('sha256', sal).update(ip).digest('hex').slice(0, 8);
}

export function limite(nombre: string, porDefecto: number): number {
  const valor = Number(process.env[nombre]);
  return Number.isFinite(valor) && valor > 0 ? valor : porDefecto;
}

export function permitido(
  ip: string,
  ruta: string,
  porDia: number,
  porMinuto = 10,
): { ok: boolean; usados: number; rafaga: boolean } {
  const ahora = Date.now();
  const dia = new Date(ahora).toISOString().slice(0, 10);
  const clave = `${ruta}|${ip}`;
  const actual = contadores.get(clave);

  if (!actual || actual.dia !== dia) {
    contadores.set(clave, { dia, n: 1, min: 1, ultimo: ahora });
    return { ok: true, usados: 1, rafaga: false };
  }

  actual.min = ahora - actual.ultimo < 60000 ? actual.min + 1 : 1;
  actual.ultimo = ahora;

  if (actual.n >= porDia) return { ok: false, usados: actual.n, rafaga: false };
  if (actual.min > porMinuto) return { ok: false, usados: actual.n, rafaga: true };

  actual.n += 1;
  return { ok: true, usados: actual.n, rafaga: false };
}

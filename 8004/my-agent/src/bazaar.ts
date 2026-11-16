/**
 * Wrapper sobre declareDiscoveryExtension de @x402/extensions.
 *
 * Los tipos publicados en 2.28.0 omiten `method` y `bodyType` del input
 * (DeclareDiscoveryExtensionInput), pero el runtime si los lee para elegir
 * entre la variante query (GET/HEAD/DELETE) y la de body (POST/PUT/PATCH).
 * Sin `method` la extension sale incompleta y el Bazaar de CDP la rechaza:
 * "/input/method: must be equal to one of the allowed values".
 *
 * Verificado en produccion: el 402 de GET lleva method GET + queryParams y el
 * de POST lleva method POST + bodyType json + body.
 */
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';

export type MetodoDescubrimiento = 'GET' | 'HEAD' | 'DELETE' | 'POST' | 'PUT' | 'PATCH';

export function declararDescubrimiento(config: {
  method: MetodoDescubrimiento;
  bodyType?: 'json' | 'form';
  input?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  output?: { example?: unknown };
}): Record<string, unknown> {
  return declareDiscoveryExtension(config as unknown as Parameters<typeof declareDiscoveryExtension>[0]);
}

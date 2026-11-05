/**
 * Verdict de un agente ERC-8004 a partir de los datos publicos de 8004scan.
 * Funcion pura (sin red) para poder probarla sin desplegar.
 */

export type Flag = { code: string; severity: 'blocker' | 'warning' | 'info'; message: string };

export type AgentCheckReport = {
  agent: {
    chain_id: number;
    token_id: string;
    name: string | null;
    owner: string | null;
    agent_wallet: string | null;
    active: boolean;
    created_at: string | null;
  };
  services: {
    declared: { name: string; endpoint: string | null; status: string }[];
    healthy: number;
    total: number;
  };
  metadata: { completeness: number | null };
  reputation: {
    feedbacks: number;
    average_score: number;
    evidence_tier: string | null;
    validations: number;
    rank: number | null;
    total_score: number | null;
  };
  wallet: { address: string | null; status: string | null };
  flags: Flag[];
  verdict: 'usable' | 'caution' | 'avoid';
  score: number;
  sources: string[];
  checked_at: string;
  note: string;
};

const HEALTH_DEAD = new Set(['unhealthy', 'down', 'error', 'broken']);

function serviceStatus(raw: any, name: string): string {
  const s = raw?.health_status?.services?.[name]?.status;
  return typeof s === 'string' ? s : 'unknown';
}

export function scoreAgent(raw: any, chainId: number, tokenId: string): AgentCheckReport {
  if (!raw || typeof raw !== 'object' || raw.error || raw.detail) {
    throw new Error('respuesta de 8004scan invalida');
  }

  const declaredNames = Object.keys(raw.services || {}).filter((k) => raw.services[k]?.endpoint);
  const declared = declaredNames.map((name) => ({
    name,
    endpoint: raw.services[name]?.endpoint ?? null,
    status: serviceStatus(raw, name),
  }));
  const healthy = declared.filter((s) => s.status === 'healthy').length;
  const dead = declared.filter((s) => HEALTH_DEAD.has(s.status));

  const feedbacks = Number(raw.total_feedbacks ?? 0);
  const average = Number(raw.average_score ?? 0);
  const completeness = raw.metadata_completeness_score ?? null;
  const active = raw.is_active !== false;
  const walletStatus = raw?.health_status?.agent_wallet?.status ?? null;
  const x402 = raw.x402_supported === true;
  const policy = raw?.scores?.leaderboard_policy || {};

  const flags: Flag[] = [];
  let score = 100;

  if (!active) {
    score -= 40;
    flags.push({ code: 'inactive', severity: 'blocker', message: 'El agente esta marcado inactivo en 8004scan.' });
  }
  if (declared.length === 0) {
    score -= 30;
    flags.push({ code: 'no_services', severity: 'blocker', message: 'No declara ningun servicio con endpoint: no hay nada que llamar.' });
  }
  if (dead.length > 0) {
    score -= 25;
    flags.push({
      code: 'service_down',
      severity: 'warning',
      message: `Servicios que no responden: ${dead.map((d) => d.name).join(', ')}.`,
    });
  }
  if (completeness !== null && completeness < 80) {
    score -= 10;
    flags.push({ code: 'thin_metadata', severity: 'warning', message: `Metadata incompleta (${completeness}/100).` });
  }
  if (feedbacks === 0) {
    score -= 15;
    flags.push({ code: 'no_feedback', severity: 'warning', message: 'Sin feedback onchain: no hay historial de uso.' });
  } else if (average === 0) {
    score -= 10;
    flags.push({
      code: 'unscored_feedback',
      severity: 'warning',
      message: `${feedbacks} feedbacks onchain pero ninguno puntua (8004scan solo puntua tag1 "starred").`,
    });
  }
  if (walletStatus !== 'healthy') {
    score -= 10;
    flags.push({
      code: 'wallet_unproven',
      severity: 'warning',
      message: `Wallet del agente sin actividad verificable (estado: ${walletStatus ?? 'desconocido'}).`,
    });
  }
  if (x402) {
    score += 5;
    flags.push({ code: 'payable', severity: 'info', message: 'Declara x402: se le puede pagar por llamada.' });
  }

  score = Math.max(0, Math.min(100, score));
  const verdict: AgentCheckReport['verdict'] = score >= 75 ? 'usable' : score >= 40 ? 'caution' : 'avoid';

  return {
    agent: {
      chain_id: chainId,
      token_id: tokenId,
      name: raw.name ?? null,
      owner: raw.owner_address ?? null,
      agent_wallet: raw.agent_wallet ?? null,
      active,
      created_at: raw.created_at ?? null,
    },
    services: { declared, healthy, total: declared.length },
    metadata: { completeness },
    reputation: {
      feedbacks,
      average_score: average,
      evidence_tier: policy.evidence_tier ?? null,
      validations: Number(raw.total_validations ?? 0),
      rank: raw.rank ?? null,
      total_score: raw.total_score ?? null,
    },
    wallet: { address: raw.agent_wallet ?? null, status: walletStatus },
    flags,
    verdict,
    score,
    sources: [
      `https://api.8004scan.io/api/v1/agents/${chainId}/${tokenId}`,
      `https://8004scan.io/agents/${chainId}/${tokenId}`,
    ],
    checked_at: new Date().toISOString(),
    note: 'Verdict heuristico sobre datos publicos de 8004scan. No es una auditoria ni una garantia.',
  };
}

/**
 * Vercel Serverless Function - Health Endpoint (gratis, estilo TIA)
 * GET /api/health -> GET /health
 *
 * Responde sin auth para que cualquier agente o 8004scan
 * pueda verificar estado en una sola llamada.
 */
import { tools } from '../src/tools.js';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed, usa GET' });
  }

  return res.status(200).json({
    status: 'ok',
    name: 'entropiav2',
    version: '2.0.2',
    chain: 'eip155:8453',
    agentId: '8453:356966',
    protocol: {
      a2a: '0.30',
      mcp: '2025-06-18',
    },
    endpoints: {
      agentCard: '/.well-known/agent-card.json',
      a2a: '/a2a',
      mcp: '/mcp',
      health: '/health',
    },
    tools: tools.map((t) => t.name),
    toolsCount: tools.length,
    pricing: {
      free: ['agent-card', 'a2a', 'mcp', 'health', 'GET /v1/agent-check/preview'],
      x402: [
        {
          endpoint: 'GET /v1/agent-check',
          price: '$0.02',
          asset: 'USDC',
          network: 'eip155:8453',
          scheme: 'exact',
        },
        {
          endpoint: 'GET /v1/premium-composition',
          price: '$0.10',
          asset: 'USDC',
          network: 'eip155:8453',
          scheme: 'exact',
        },
        {
          endpoint: 'POST /v1/prompt/analyze',
          price: '$0.02',
          asset: 'USDC',
          network: 'eip155:8453',
          scheme: 'exact',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  });
}

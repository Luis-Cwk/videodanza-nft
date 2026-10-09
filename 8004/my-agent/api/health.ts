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
    version: '2.0.0',
    chain: 'eip155:11155111',
    agentId: '11155111:2387',
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
    pricing: 'free on testnet, sin API key',
    timestamp: new Date().toISOString(),
  });
}

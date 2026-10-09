/**
 * Vercel Serverless Function - MCP Endpoint
 * POST /api/mcp
 * 
 * For Vercel deployment, MCP is exposed as HTTP JSON-RPC
 * instead of stdio (which only works locally).
 */
import { tools, handleToolCall } from '../src/tools.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'entropiav2-mcp',
      version: '1.0.0',
      protocolVersion: '2025-06-18',
      status: 'healthy',
      description: 'MCP endpoint de entropiav2. Usa POST con JSON-RPC 2.0 para tools/list y tools/call.',
      tools: tools.map((t) => t.name),
      toolsCount: tools.length,
      endpoints: {
        mcp: '/mcp',
        agentCard: '/.well-known/agent-card.json',
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== '2.0') {
    return res.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
  }

  try {
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'entropiav2-mcp', version: '1.0.0' },
        },
        id,
      });
    }

    if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
      return res.status(202).end();
    }

    if (method === 'ping') {
      return res.json({ jsonrpc: '2.0', result: {}, id });
    }

    if (method === 'tools/list') {
      return res.json({ jsonrpc: '2.0', result: { tools }, id });
    }

    if (method === 'tools/call') {
      const result = await handleToolCall(params?.name, params?.arguments ?? {});
      return res.json({
        jsonrpc: '2.0',
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
        id,
      });
    }

    return res.json({
      jsonrpc: '2.0',
      error: { code: -32601, message: `Method not found: ${method}` },
      id,
    });
  } catch (error: any) {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message || 'Internal error' },
      id,
    });
  }
}

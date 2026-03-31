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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== '2.0') {
    return res.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
  }

  try {
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

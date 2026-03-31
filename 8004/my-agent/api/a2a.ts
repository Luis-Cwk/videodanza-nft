/**
 * Vercel Serverless Function - A2A JSON-RPC Endpoint
 * POST /api/a2a
 * 
 * Handles all A2A protocol methods:
 * - message/send
 * - tasks/get
 * - tasks/cancel
 */
import { v4 as uuidv4 } from 'uuid';
import { generateResponse, generateContract, type AgentMessage } from '../src/agent.js';

// ============================================================================
// In-Memory Storage (Vercel serverless - resets per cold start)
// For production, use Vercel KV or external DB
// ============================================================================

const tasks = new Map<string, {
  id: string;
  contextId: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
  messages: Array<{ role: 'user' | 'agent'; parts: Array<{ type: 'text'; text: string }> }>;
  artifacts: Array<{ name: string; parts: Array<{ type: 'text'; text: string }> }>;
}>();

const conversationHistory = new Map<string, AgentMessage[]>();

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: any, res: any) {
  // CORS headers
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
    const result = await handleMethod(method, params);
    res.json({ jsonrpc: '2.0', result, id });
  } catch (error: any) {
    res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message || 'Internal error' },
      id,
    });
  }
}

// ============================================================================
// Method Handlers
// ============================================================================

async function handleMethod(method: string, params: any) {
  switch (method) {
    case 'message/send':
      return handleMessageSend(params);
    case 'tasks/get':
      return handleTasksGet(params);
    case 'tasks/cancel':
      return handleTasksCancel(params);
    default:
      throw new Error(`Method not found: ${method}`);
  }
}

async function handleMessageSend(params: {
  message: { role: string; parts: Array<{ type: string; text?: string }> };
  configuration?: { contextId?: string; streaming?: boolean };
}) {
  const { message, configuration } = params;
  const contextId = configuration?.contextId || uuidv4();
  const taskId = uuidv4();

  const userText = message.parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('\n');

  const history = conversationHistory.get(contextId) || [];

  // Detect contract requests
  const contractKeywords = ['contrato', 'smart contract', 'nft', 'token', 'dao', 'marketplace', 'solidity', 'erc20', 'erc721'];
  const isContractRequest = contractKeywords.some(keyword => userText.toLowerCase().includes(keyword.toLowerCase()));
  
  let contractType = '';
  if (isContractRequest) {
    if (userText.toLowerCase().includes('nft') || userText.toLowerCase().includes('erc721')) contractType = 'nft';
    else if (userText.toLowerCase().includes('token') || userText.toLowerCase().includes('erc20')) contractType = 'token';
    else if (userText.toLowerCase().includes('marketplace')) contractType = 'marketplace';
    else if (userText.toLowerCase().includes('dao')) contractType = 'dao';
  }

  // Non-streaming response (Vercel serverless doesn't support SSE well on free tier)
  let responseText = '';
  
  if (isContractRequest && contractType) {
    const contractCode = generateContract(contractType, {});
    responseText = await generateResponse(
      `El usuario quiere crear un contrato tipo ${contractType}. Explícale qué hace este contrato y dale el código:\n\n${contractCode}\n\nAdemás, explica: 1) Cómo desplegarlo en Remix IDE, 2) Parámetros importantes a configurar, 3) Costos de gas aproximados en Sepolia`,
      history
    );
  } else {
    responseText = await generateResponse(userText, history);
  }

  // Update conversation history
  history.push({ role: 'user', content: userText });
  history.push({ role: 'assistant', content: responseText });
  conversationHistory.set(contextId, history);

  const task = {
    id: taskId,
    contextId,
    status: 'completed' as const,
    messages: [
      { role: 'user' as const, parts: [{ type: 'text' as const, text: userText }] },
      { role: 'agent' as const, parts: [{ type: 'text' as const, text: responseText }] },
    ],
    artifacts: [],
  };

  tasks.set(taskId, task);
  return task;
}

async function handleTasksGet(params: { taskId: string }) {
  const task = tasks.get(params.taskId);
  if (!task) throw new Error('Task not found');
  return task;
}

async function handleTasksCancel(params: { taskId: string }) {
  const task = tasks.get(params.taskId);
  if (!task) throw new Error('Task not found');
  task.status = 'canceled';
  return task;
}

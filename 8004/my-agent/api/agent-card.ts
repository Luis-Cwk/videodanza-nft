/**
 * Vercel Serverless Function - Agent Card Discovery
 * GET /api/agent-card
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req: any, res: any) {
  const cardPath = join(process.cwd(), '.well-known', 'agent-card.json');
  const card = JSON.parse(readFileSync(cardPath, 'utf-8'));
  
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(card);
}

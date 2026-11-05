// Lectura de getSummary del Reputation Registry (fuente on-chain del promedio)
import 'dotenv/config';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';

const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
const AGENT_ID = 2387n;
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

const TESTERS = [
  getAddress('0x9732e0f07b17b1360d15F2456FC5f2Baf858DD13'),
  getAddress('0xd8a2924F57cd8b6a07C20A599101b52da5E11931'),
  getAddress('0x335eb588c43c6ce50565cba38118ffd258c4e9d2'),
];

const abi = [
  { type: 'function', name: 'getSummary', stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ] },
];

// Sin tag filter
const s1 = await client.readContract({ address: REPUTATION, abi, functionName: 'getSummary', args: [AGENT_ID, TESTERS, '', ''] });
console.log('getSummary (sin tags):', { count: s1[0].toString(), value: s1[1].toString(), decimals: s1[2] });

// Con tag studio
const s2 = await client.readContract({ address: REPUTATION, abi, functionName: 'getSummary', args: [AGENT_ID, TESTERS, 'studio', ''] });
console.log('getSummary (tag1=studio):', { count: s2[0].toString(), value: s2[1].toString(), decimals: s2[2] });

// Sin clientes específicos (array vacio - "todos los clientes" segun spec)
try {
  const s3 = await client.readContract({ address: REPUTATION, abi, functionName: 'getSummary', args: [AGENT_ID, [], '', ''] });
  console.log('getSummary (sin clients):', { count: s3[0].toString(), value: s3[1].toString(), decimals: s3[2] });
} catch (e) {
  console.log('getSummary (sin clients) fallo:', (e.shortMessage || e.message || "").slice(0, 150));
}

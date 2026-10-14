// Verificacion on-chain de ambos fixes
import 'dotenv/config';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';

const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const AGENT_ID = 2387n;
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

const TESTERS = [
  [getAddress('0x9732e0f07b17b1360d15F2456FC5f2Baf858DD13')],
  [getAddress('0xd8a2924F57cd8b6a07C20A599101b52da5E11931')],
  [getAddress('0x335eb588c43c6ce50565cba38118ffd258c4e9d2')],
];

const idAbi = [{ type: 'function', name: 'getAgentWallet', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ type: 'address' }] }];
const repAbi = [
  { type: 'function', name: 'getLastIndex', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'clientAddress', type: 'address' }], outputs: [{ type: 'uint64' }] },
  { type: 'function', name: 'readFeedback', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'clientAddress', type: 'address' }, { name: 'feedbackIndex', type: 'uint64' }], outputs: [{ name: 'value', type: 'int128' }, { name: 'valueDecimals', type: 'uint8' }, { name: 'tag1', type: 'string' }, { name: 'tag2', type: 'string' }, { name: 'isRevoked', type: 'bool' }] },
];

const wallet = await client.readContract({ address: IDENTITY, abi: idAbi, functionName: 'getAgentWallet', args: [AGENT_ID] });
console.log('agentWallet(2387):', wallet);

for (const [addr] of TESTERS) {
  const last = await client.readContract({ address: REPUTATION, abi: repAbi, functionName: 'getLastIndex', args: [AGENT_ID, addr] });
  console.log(`\n${addr} lastIndex=${last}`);
  for (let i = 1n; i <= last; i++) {
    const fb = await client.readContract({ address: REPUTATION, abi: repAbi, functionName: 'readFeedback', args: [AGENT_ID, addr, i] });
    console.log(`  idx ${i}: value=${fb[0]} tags=${fb[2]}/${fb[3]} revoked=${fb[4]}`);
  }
}

// Verifica el typehash de AgentWalletSet contra el const en el bytecode del contrato.
// Constituyente observado en bytecode: 678b53cd718d595370ab070ebf48edfdcd834beac116bf23e625fc7f4d5b7d32
import { keccak256, toHex } from 'viem';

const fromBytecode = '0x678b53cd718d595370ab070ebf48edfdcd834beac116bf23e625fc7f4d5b7d32';

const candidates = [
  'AgentWalletSet(uint256 agentId,address newWallet,address owner,uint256 deadline)',
  'AgentWalletSet(uint256 agentId,address newWallet,uint256 deadline)',
  'AgentWalletSet(uint256 agentId,address newWallet,uint256 deadline,address owner)',
  'SetAgentWallet(uint256 agentId,address newWallet,uint256 deadline)',
];

for (const c of candidates) {
  const h = keccak256(toHex(c));
  console.log(h === fromBytecode ? 'MATCH  ' : '       ', h, c);
}

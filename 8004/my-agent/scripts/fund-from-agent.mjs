// Mueve USDC de la agentWallet a una wallet compradora.
// Uso: node fund-from-agent.mjs <destino.json> <monto_usdc>
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseGwei, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const destino = process.argv[2] || '.buyer-emailtest.json';
const monto = BigInt(Math.round(Number(process.argv[3] || '0.05') * 1e6));
const RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const src = JSON.parse(readFileSync(new URL('../.agent-wallet.json', import.meta.url), 'utf8'));
const dst = JSON.parse(readFileSync(new URL(`../${destino}`, import.meta.url), 'utf8'));
const account = privateKeyToAccount(src.privateKey);

const publicClient = createPublicClient({ chain: base, transport: http(RPC) });
const abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }] },
];
const bal = (a) => publicClient.readContract({ address: USDC, abi, functionName: 'balanceOf', args: [a] });

const [srcBal, dstBal] = await Promise.all([bal(account.address), bal(dst.address)]);
console.log(`origen ${account.address} USDC=${formatUnits(srcBal, 6)}`);
console.log(`destino ${dst.address} USDC=${formatUnits(dstBal, 6)}`);
if (srcBal < monto) { console.error('saldo insuficiente'); process.exit(1); }

const hash = await createWalletClient({ account, chain: base, transport: http(RPC) }).writeContract({
  address: USDC, abi, functionName: 'transfer', args: [dst.address, monto],
  maxFeePerGas: parseGwei('0.1'), maxPriorityFeePerGas: 0n,
});
const rc = await publicClient.waitForTransactionReceipt({ hash });
console.log(`tx ${hash} status=${rc.status}`);
console.log(`destino ahora USDC=${formatUnits(await bal(dst.address), 6)}`);

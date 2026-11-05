// Fondea la wallet compradora de mainnet con un poco de USDC en Base,
// desde la agentWallet, para poder pagar /v1/agent-check y entrar al Bazaar.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseGwei, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const AMOUNT = 30_000n; // 0.03 USDC (6 decimales)
const RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const src = JSON.parse(readFileSync(new URL('../.agent-wallet.json', import.meta.url), 'utf8'));
const dst = JSON.parse(readFileSync(new URL('../.buyer-mainnet.json', import.meta.url), 'utf8'));
const pk = src.privateKey || src.private_key || src.key || src.pk;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
const TO = dst.address;

const publicClient = createPublicClient({ chain: base, transport: http(RPC) });
const abi = [{
  name: 'balanceOf', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }],
}, {
  name: 'transfer', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }],
}];

const bal = (a) => publicClient.readContract({ address: USDC, abi, functionName: 'balanceOf', args: [a] });
const [srcBal, dstBal, eth] = await Promise.all([
  bal(account.address), bal(TO), publicClient.getBalance({ address: account.address }),
]);
console.log(`origen  ${account.address}  USDC=${formatUnits(srcBal, 6)}  ETH=${formatUnits(eth, 18)}`);
console.log(`destino ${TO}  USDC=${formatUnits(dstBal, 6)}`);

if (dstBal >= AMOUNT) { console.log('el destino ya tiene suficiente; no mando nada'); process.exit(0); }
if (srcBal < AMOUNT) { console.error('saldo USDC insuficiente en el origen'); process.exit(1); }

const hash = await createWalletClient({ account, chain: base, transport: http(RPC) }).writeContract({
  address: USDC, abi, functionName: 'transfer', args: [TO, AMOUNT],
  maxFeePerGas: parseGwei('0.1'), maxPriorityFeePerGas: 0n,
});
const rc = await publicClient.waitForTransactionReceipt({ hash });
console.log(`tx ${hash} status=${rc.status} gasUsed=${rc.gasUsed}`);
console.log(`destino nuevo saldo USDC=${formatUnits(await bal(TO), 6)}`);

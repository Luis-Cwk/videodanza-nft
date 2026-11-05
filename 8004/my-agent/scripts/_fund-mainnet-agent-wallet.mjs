// Mueve un poco de ETH de la owner wallet a la agentWallet de mainnet (0xFc4f)
// para que 8004scan deje de leerla como Empty wallet y el publisher tenga datos.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseEther, formatEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const TO = '0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f';
const AMOUNT = parseEther('0.0004');
const RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const j = JSON.parse(readFileSync(new URL('../.owner-wallet.json', import.meta.url), 'utf8'));
const pk = j.privateKey || j.private_key || j.key || j.pk;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
const publicClient = createPublicClient({ chain: base, transport: http(RPC) });

const fromBal = await publicClient.getBalance({ address: account.address });
const toBal = await publicClient.getBalance({ address: TO });
console.log(`owner ${account.address} ${formatEther(fromBal)} ETH`);
console.log(`agent ${TO} ${formatEther(toBal)} ETH`);

if (fromBal < AMOUNT + parseEther('0.00005')) {
  console.error('Saldo insuficiente para mover sin riesgo');
  process.exit(1);
}

const hash = await createWalletClient({ account, chain: base, transport: http(RPC) }).sendTransaction({
  to: TO,
  value: AMOUNT,
  maxFeePerGas: parseGwei('0.1'),
  maxPriorityFeePerGas: 0n,
});
const rc = await publicClient.waitForTransactionReceipt({ hash });
console.log(`tx ${hash} status=${rc.status} gasUsed=${rc.gasUsed}`);
console.log(`agent nuevo saldo ${formatEther(await publicClient.getBalance({ address: TO }))} ETH`);

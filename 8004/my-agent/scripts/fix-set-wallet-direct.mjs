// Fix 1b: firmar setAgentWallet localmente (evita el bug del SDK que firma via RPC)
// y simular contra el contrato para encontrar la variante EIP-712 valida.
// Luego envia la tx. Requiere PRIVATE_KEY (owner = 0xD70E...40cF).
import 'dotenv/config';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const AGENT_ID = 2387n;
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const NEW_WALLET = '0xD70ECAff906A739167EFD20275D0a1d518AC40cF';

const pk = process.env.PRIVATE_KEY;
if (!pk) { console.error('Falta PRIVATE_KEY'); process.exit(1); }
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

const SET_WALLET_ABI = [{
  type: 'function', name: 'setAgentWallet', stateMutability: 'nonpayable',
  inputs: [
    { name: 'agentId', type: 'uint256' },
    { name: 'newWallet', type: 'address' },
    { name: 'deadline', type: 'uint256' },
    { name: 'signature', type: 'bytes' },
  ],
  outputs: [],
}];

const domain = {
  name: 'ERC8004IdentityRegistry',
  version: '1',
  chainId: 11155111,
  verifyingContract: REGISTRY,
};

async function main() {
  const block = await publicClient.getBlock({ blockTag: 'latest' });
  const chainNow = Number(block.timestamp);
  const deadline = BigInt(chainNow + 240);
  console.log('Signer (owner):', account.address);
  console.log('New wallet    :', NEW_WALLET);
  console.log('Deadline      :', deadline.toString());

  if (account.address.toLowerCase() !== NEW_WALLET.toLowerCase()) {
    console.log('NOTA: el signer no es la newWallet; se necesita la llave de la newWallet para firmar.');
  }

  // Variantes de tipo a probar
  const variants = [
    {
      label: 'con owner',
      types: { AgentWalletSet: [
        { name: 'agentId', type: 'uint256' },
        { name: 'newWallet', type: 'address' },
        { name: 'owner', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ]},
      message: { agentId: AGENT_ID, newWallet: NEW_WALLET, owner: account.address, deadline },
    },
    {
      label: 'sin owner',
      types: { AgentWalletSet: [
        { name: 'agentId', type: 'uint256' },
        { name: 'newWallet', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ]},
      message: { agentId: AGENT_ID, newWallet: NEW_WALLET, deadline },
    },
  ];

  for (const v of variants) {
    try {
      const signature = await account.signTypedData({
        domain,
        types: v.types,
        primaryType: 'AgentWalletSet',
        message: v.message,
      });
      console.log(`\nVariante [${v.label}] firma: ${signature.slice(0, 20)}...`);

      // Simular contra el contrato (no envia tx)
      const { request } = await publicClient.simulateContract({
        address: REGISTRY,
        abi: SET_WALLET_ABI,
        functionName: 'setAgentWallet',
        args: [AGENT_ID, NEW_WALLET, deadline, signature],
        account,
      });
      console.log(`Variante [${v.label}] SIMULACION OK. Enviando tx...`);
      const hash = await walletClient.writeContract(request);
      console.log('Tx hash:', hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Status:', receipt.status, '| block:', receipt.blockNumber);

      // Verificar estado
      const getWalletAbi = [{ type: 'function', name: 'getAgentWallet', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ type: 'address' }] }];
      const wallet = await publicClient.readContract({ address: REGISTRY, abi: getWalletAbi, functionName: 'getAgentWallet', args: [AGENT_ID] });
      console.log('agentWallet on-chain ahora:', wallet);
      if (wallet.toLowerCase() === NEW_WALLET.toLowerCase()) {
        console.log('EXITO: agentWallet actualizado.');
        process.exit(0);
      }
      console.log('La tx paso pero la wallet quedo distinta. Continuando variantes...');
    } catch (e) {
      console.log(`Variante [${v.label}] fallo:`, (e.shortMessage || e.message || String(e)).slice(0, 300));
    }
  }

  console.error('\nNinguna variante funciono. Se requiere revisar el contrato.');
  process.exit(1);
}

main();

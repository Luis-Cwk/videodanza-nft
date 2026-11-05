// Lee el dominio EIP-712 del Identity Registry para firmar setAgentWallet correctamente.
import 'dotenv/config';
import { createPublicClient, http, keccak256, toHex, encodeAbiParameters, parseAbiParameters } from 'viem';
import { sepolia } from 'viem/chains';

const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

// EIP-5267 eip712Domain()
const EIP712_DOMAIN_ABI = [{
  type: 'function', name: 'eip712Domain', stateMutability: 'view', inputs: [],
  outputs: [
    { name: 'fields', type: 'bytes1' },
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'salt', type: 'bytes32' },
    { name: 'extensions', type: 'uint256[]' },
  ],
}];

const DOMAIN_SEP_ABI = [{ type: 'function', name: 'DOMAIN_SEPARATOR', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] }];

let domain = null;
try {
  const d = await client.readContract({ address: REGISTRY, abi: EIP712_DOMAIN_ABI, functionName: 'eip712Domain' });
  domain = { fields: d[0], name: d[1], version: d[2], chainId: d[3], verifyingContract: d[4], salt: d[5] };
  console.log('eip712Domain():', JSON.stringify(domain, (k, v) => typeof v === 'bigint' ? v.toString() : v));
} catch (e) {
  console.log('eip712Domain() no disponible:', e.shortMessage || e.message);
}

let domainSep = null;
try {
  domainSep = await client.readContract({ address: REGISTRY, abi: DOMAIN_SEP_ABI, functionName: 'DOMAIN_SEPARATOR' });
  console.log('DOMAIN_SEPARATOR():', domainSep);
} catch (e) {
  console.log('DOMAIN_SEPARATOR() no disponible:', e.shortMessage || e.message);
}

// Probar candidatos de nombre/version contra el domain separator
if (domainSep) {
  const candidates = [
    ['ERC8004IdentityRegistry', '1'],
    ['IdentityRegistry', '1'],
    ['ERC8004IdentityRegistryUpgradeable', '1'],
    ['IdentityRegistryUpgradeable', '1'],
    [domain?.name || 'none', domain?.version || '1'],
  ];
  const EIP712_DOMAIN_TYPEHASH = keccak256(toHex('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'));
  for (const [name, version] of candidates) {
    if (!name || name === 'none') continue;
    const computed = keccak256(encodeAbiParameters(
      parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
      [EIP712_DOMAIN_TYPEHASH, keccak256(toHex(name)), keccak256(toHex(version)), 11155111n, REGISTRY]
    ));
    console.log(`candidate ${name}/${version}:`, computed, computed.toLowerCase() === domainSep.toLowerCase() ? 'MATCH' : '');
  }
}

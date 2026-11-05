# Script de despliegue usando Web3.py
# Instalación: pip install web3 python-dotenv

import os
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
RPC_URL = os.getenv('SEPOLIA_RPC_URL', 'https://rpc.sepolia.org')
PRIVATE_KEY = os.getenv('PRIVATE_KEY')

# ABI del contrato (simplificado - solo constructor)
CONTRACT_ABI = '''[
    {
        "inputs": [
            {"internalType": "string", "name": "name", "type": "string"},
            {"internalType": "string", "name": "symbol", "type": "string"},
            {"internalType": "string", "name": "baseURI", "type": "string"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    }
]'''

# Bytecode del contrato (debes compilar primero y copiar el bytecode aquí)
# Esto es un placeholder - reemplazar con el bytecode real después de compilar
CONTRACT_BYTECODE = "0x..."

def deploy_contract():
    if not PRIVATE_KEY:
        print("❌ Error: PRIVATE_KEY no configurada en .env")
        return
    
    # Conectar a la red
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    
    if not w3.is_connected():
        print("❌ Error: No se pudo conectar a la red")
        return
    
    print(f"✅ Conectado a la red. Chain ID: {w3.eth.chain_id}")
    
    # Crear cuenta desde private key
    account = Account.from_key(PRIVATE_KEY)
    print(f"👤 Cuenta: {account.address}")
    
    # Verificar balance
    balance = w3.eth.get_balance(account.address)
    print(f"💰 Balance: {w3.from_wei(balance, 'ether')} ETH")
    
    if balance == 0:
        print("❌ Error: No tienes ETH de prueba. Obtén algunos en https://sepoliafaucet.com/")
        return
    
    # Verificar que tenemos bytecode
    if CONTRACT_BYTECODE == "0x...":
        print("⚠️  Advertencia: Debes reemplazar CONTRACT_BYTECODE con el bytecode real")
        print("   Compila el contrato en Remix y copia el bytecode desde el compilador")
        return
    
    # Desplegar contrato
    print("\n🚀 Desplegando contrato...")
    
    Contract = w3.eth.contract(abi=CONTRACT_ABI, bytecode=CONTRACT_BYTECODE)
    
    # Construir transacción
    tx = Contract.constructor(
        "Evolving NFT",  # name
        "ENFT",          # symbol
        ""               # baseURI
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 3000000,
        'gasPrice': w3.eth.gas_price,
        'chainId': 11155111  # Sepolia
    })
    
    # Firmar y enviar
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"⏳ Transacción enviada: {tx_hash.hex()}")
    
    # Esperar confirmación
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if tx_receipt['status'] == 1:
        print(f"✅ Contrato desplegado exitosamente!")
        print(f"📍 Dirección del contrato: {tx_receipt['contractAddress']}")
        print(f"🔗 Ver en Etherscan: https://sepolia.etherscan.io/address/{tx_receipt['contractAddress']}")
        
        # Guardar dirección en archivo
        with open('contract_address.txt', 'w') as f:
            f.write(tx_receipt['contractAddress'])
        print(f"📝 Dirección guardada en contract_address.txt")
    else:
        print("❌ Error: La transacción falló")

if __name__ == "__main__":
    deploy_contract()

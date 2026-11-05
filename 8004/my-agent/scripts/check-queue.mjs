import 'dotenv/config'
import { privateKeyToAccount } from 'viem/accounts'

const API = 'https://api.8004scan.io/api/v1'
const account = privateKeyToAccount(process.env.PRIVATE_KEY)

const nonceJson = await (await fetch(`${API}/auth/nonce`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account.address }) })).json()
const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message
const signature = await account.signMessage({ message: String(nonceJson.message || nonce) })
const loginJson = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account.address, signature, nonce }) })).json()
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token
console.log('login:', token ? 'OK' : 'FAIL', JSON.stringify(loginJson).slice(0, 120))

const H = { 'X-Access-Token': token }
const id = '0f3fe0b3-267c-4dbe-8395-64bdfbf70b6f'

const list = await fetch(`${API}/webhooks`, { headers: H })
console.log('webhooks list:', list.status, (await list.text()).slice(0, 300))

const del = await fetch(`${API}/webhooks/${id}/deliveries`, { headers: H })
const delText = await del.text()
console.log('deliveries:', del.status, delText.slice(0, 800))

const cert = await fetch(`${API}/users/me/certifications/publisher`, { headers: H })
console.log('publisher cert status:', cert.status, (await cert.text()).slice(0, 300))

import { readFileSync } from "fs";
import { createClient, createAccount } from "genlayer-js-legacy";
import { studionet } from "genlayer-js-legacy/chains";

const keys = JSON.parse(readFileSync(".secrets/demo-keys.json", "utf8"));
const seller = createAccount(keys.seller);
const buyer = createAccount(keys.buyer);
const client = createClient({ chain: studionet, account: seller });
const address = process.env.CONTRACT_ADDRESS || "0x3F6ff110fa8DA1D3517521cE697BD75377C7D721";

const [contractSeller, count] = await Promise.all([
  client.readContract({ address, functionName: "get_seller", args: [] }),
  client.readContract({ address, functionName: "get_order_count", args: [] })
]);

console.log(JSON.stringify({
  address,
  seller: seller.address,
  buyer: buyer.address,
  contractSeller,
  orderCount: String(count)
}, null, 2));

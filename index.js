import xrpl from "xrpl";
import { mintTicketNFT } from "./xrp/test-mint-nft.js";
import { ListNftsAndOffers } from "./xrp/test-list-nfts.js";
import { createBuyOfferForNft } from "./xrp/test-buy-nft.js";

// user creates wallet
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

async function createWallet(client) {
  // Funds a fresh Testnet wallet using the Testnet faucet.
  // Returns { wallet, balance }.
  const fundResult = await client.fundWallet();
  console.log("Funded wallet:", fundResult.wallet.address);
  console.log("Starting balance:", fundResult.balance);
  return fundResult.wallet;
}

async function sendPaymentTx(client, wallet, destination, amountXrp) {
  const prepared = await client.autofill({
    TransactionType: "Payment",
    Account: wallet.address,
    Amount: xrpl.xrpToDrops(amountXrp),
    Destination: destination,
  });

  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  return result; // includes meta + validated status
}

async function main() {
  await client.connect();

  const newWallet = await createWallet(client);

  const fundResult = await client.fundWallet();
  const wallet = fundResult.wallet;

  console.log("Funded:", wallet.classicAddress);
  console.log("Seed:", wallet.seed); // just for debug

  // put a valid Testnet destination address here:
  const destination = "rf26gfMAfxaSK8cRJ8b3HpSn11N4v5xD9h";
  const amount = 10;

  // const result = await sendPaymentTx(client, newWallet, destination, amount);

  // console.log("Transaction result:");
  // console.dir(result, { depth: null });




  // test mint NFT
  const mintRes = await mintTicketNFT(
    client,
    wallet,
    "https://example.com/tickets/ticket-0001.json",
    2026
  );

  console.log("Done minting NFT");

  console.dir(mintRes, { depth: null });

  const owner = mintRes.result.tx_json.Account;
  const nftId = mintRes.result.meta.nftoken_id;

  console.log("Owner:", owner);
  console.log("Buying NFT...");


  // Buy nft
  await createBuyOfferForNft({
    nftId,
    ownerClassicAddress: owner,
    offerAmountXrp: 1,
  });

  // List NFTs
  await ListNftsAndOffers(client, wallet.classicAddress);

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

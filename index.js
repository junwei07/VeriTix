import xrpl from "xrpl";

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

  const wallet = await createWallet(client);

  // put a valid Testnet destination address here:
  const destination = "rf26gfMAfxaSK8cRJ8b3HpSn11N4v5xD9h";
  const amount = 10;

  const result = await sendPaymentTx(client, wallet, destination, amount);

  console.log("Transaction result:");
  console.dir(result, { depth: null });

  await client.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

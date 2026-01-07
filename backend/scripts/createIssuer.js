// scripts/createIssuer.js
const xrpl = require("xrpl");

(async () => {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const wallet = xrpl.Wallet.generate();

  console.log("ISSUER ADDRESS:", wallet.address);
  console.log("ISSUER SEED:", wallet.seed);

  await client.fundWallet(wallet);
  console.log("Wallet funded on testnet");

  await client.disconnect();
})();

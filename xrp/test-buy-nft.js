import xrpl from "xrpl";

export async function createBuyOfferForNft({
  nftId,
  ownerClassicAddress, // the minter/current owner (r...)
  offerAmountXrp = 1, // how much the buyer offers
}) {
  if (!xrpl.isValidClassicAddress(ownerClassicAddress)) {
    throw new Error(`Bad owner address: ${ownerClassicAddress}`);
  }

  const client2 = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client2.connect();

  // Buyer wallet (funded by Testnet faucet)
  const { wallet: buyer } = await client2.fundWallet();
  console.log("Buyer:", buyer.classicAddress);

  // BUY offer: do NOT set tfSellNFToken; DO set Owner to current owner
  const tx = await client2.autofill({
    TransactionType: "NFTokenCreateOffer",
    Account: buyer.classicAddress,
    NFTokenID: nftId,
    Owner: ownerClassicAddress,
    Amount: xrpl.xrpToDrops(offerAmountXrp),
  });

  const signed = buyer.sign(tx);
  const submit = await client2.submitAndWait(signed.tx_blob);

  console.log("CreateOffer result:", submit.result.meta.TransactionResult);

  // Verify by fetching buy offers
  const offersRes = await client2.request({
    command: "nft_buy_offers",
    nft_id: nftId,
    ledger_index: "validated",
  });

  console.log("Buy offers:", offersRes.result.offers?.length ?? 0);
  console.log(
    "Top offer index:",
    offersRes.result.offers?.[0]?.nft_offer_index
  );

  await client2.disconnect();

  return {
    buyer: buyer.classicAddress,
    submit,
    offers: offersRes.result.offers ?? [],
  };
}

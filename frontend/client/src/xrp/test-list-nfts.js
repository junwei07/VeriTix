import * as xrpl from "xrpl";

export default async function ListNftsAndOffers(
  client,
  account,
  log = () => {}
) {
  if (!account) throw new Error("Missing account");
  if (!xrpl.isValidClassicAddress(account)) {
    throw new Error(`Invalid classic address: "${account}"`);
  }

  log("Sending view NFT request...");

  const response = await client.request({
    command: "account_nfts",
    account,
    ledger_index: "validated",
  });

  const nfts = response.result.account_nfts ?? [];
  log(`Found ${nfts.length} NFT(s) on account ${account}`);

  // collect results to return
  const offersByNft = {};

  for (const nft of nfts) {
    const nftId = nft.NFTokenID;
    try {
      const r = await client.request({
        command: "nft_buy_offers",
        nft_id: nftId,
        ledger_index: "validated",
      });

      const offers = r.result.offers ?? [];
      offersByNft[nftId] = offers;

      log(`Buy offers for ${nftId}: ${offers.length}`);
    } catch (e) {
      // No offers is a common case; XRPL often throws for empty offers
      offersByNft[nftId] = [];
      log(`No buy offers for ${nftId} (or request failed).`);
    }
  }

  return {
    account,
    nfts,
    offersByNft,
  };
}

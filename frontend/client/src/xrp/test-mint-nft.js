import { convertStringToHex, NFTokenMintFlags } from "xrpl";

export default async function mintTicketNFT(
  client,
  wallet,
  metadataUrl,
  taxon = 2026
) {
  const txJson = {
    TransactionType: "NFTokenMint",
    Account: wallet.classicAddress,
    URI: convertStringToHex(metadataUrl),
    NFTokenTaxon: taxon,
    Flags: NFTokenMintFlags.tfTransferable,
    TransferFee: 0,
  };

  const prepared = await client.autofill(txJson);
  const signed = wallet.sign(prepared);
  return await client.submitAndWait(signed.tx_blob);
}

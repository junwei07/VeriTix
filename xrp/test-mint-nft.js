import xrpl from "xrpl";

export async function mintTicketNFT(client, wallet, metadataUrl, taxon = 2026) {
  const txJson = {
    TransactionType: "NFTokenMint",
    Account: wallet.classicAddress,
    URI: xrpl.convertStringToHex(metadataUrl),
    NFTokenTaxon: taxon,
    Flags: xrpl.NFTokenMintFlags.tfTransferable, // IMPORTANT
    TransferFee: 0,
  };

  const prepared = await client.autofill(txJson);
  const signed = wallet.sign(prepared);
  return await client.submitAndWait(signed.tx_blob);

}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Client } from "xrpl";
import mintTicketNFT from "@/xrp/test-mint-nft";
import ListNftsAndOffers from "@/xrp/test-list-nfts";
import createBuyOfferForNft from "@/xrp/test-buy-nft";
import { useLocation, useRouter } from "wouter";

type LogLine = {
  ts: number;
  level: "log" | "info" | "warn" | "error";
  msg: string;
};

function safeStringify(value: any) {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (k, v) => {
      if (typeof v === "bigint") return v.toString();
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    },
    2
  );
}

function truncateMiddle(value?: string, head = 6, tail = 4) {
  if (!value) return "";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

async function copyToClipboard(value: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function getExplorerLink(txHash?: string) {
  if (!txHash) return "#";
  return `https://testnet.xrpl.org/transactions/${txHash}`;
}

function persistTicket({
  walletAddress,
  tokenId,
  txHash,
}: {
  walletAddress: string;
  tokenId: string;
  txHash?: string;
}) {
  try {
    const existing = localStorage.getItem("veritix_tickets");
    const tickets = existing ? JSON.parse(existing) : [];
    tickets.push({
      tokenId,
      txHash: txHash || "",
      ticketType: "minted_ticket",
      purchasedAt: new Date().toISOString(),
      walletAddress,
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: "Minted Ticket",
      amountCents: 0,
    });
    localStorage.setItem("veritix_tickets", JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent("veritix_tickets_changed"));
  } catch {
    // Best-effort storage for demo UX
  }
}

export default function CreatWalletCard({
  onSubmit,
  onBack,
}: {
  onSubmit?: (values: { username: string; password: string }) => void;
  onBack?: () => void;
}) {
  const [status, setStatus] = useState<
    | "idle"
    | "connecting"
    | "funding"
    | "minting"
    | "buying"
    | "listing"
    | "done"
    | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [, setLocation] = useLocation();
  

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [result, setResult] = useState<{
    fundedAddress?: string;
    startingBalance?: string | number;
    owner?: string;
    nftId?: string;
    txHash?: string;
    mintRes?: any;
    listRes?: any;
  }>({});

  const clientRef = useRef<Client | null>(null);
  const cancelledRef = useRef(false);

  const appendLog = (level: LogLine["level"], ...args: any[]) => {
    const msg = args
      .map((a) => (typeof a === "string" ? a : safeStringify(a)))
      .join(" ");
    setLogs((prev) => [...prev, { ts: Date.now(), level, msg }].slice(-400)); // keep last 400 lines
  };

  const connectClient = async () => {
    const client = await new Client("wss://s.altnet.rippletest.net:51233");
    console.log(client);
    clientRef.current = client;
    setStatus("connecting");
    appendLog("info", "Connecting to XRPL Testnet…");
    await client.connect();
    appendLog("info", "Connected ✅");
    return client;
  };

  const cleanup = async () => {
    const client = clientRef.current;
    clientRef.current = null;
    if (client?.isConnected()) {
      try {
        await client.disconnect();
      } catch {}
    }
  };

  const runFlow = async () => {
    cancelledRef.current = false;
    setError(null);
    setLogs([]);
    setResult({});
    try {
      const client = await connectClient();
      if (cancelledRef.current) return;

      // // Fund wallet
      setStatus("funding");
      appendLog("info", "Funding a fresh Testnet wallet (faucet)…");
      const fundResult = await client.fundWallet();
      const wallet = fundResult.wallet;
      appendLog("log", "Funded:", wallet.classicAddress);
      appendLog("log", "Starting balance:", fundResult.balance);

      // // ❗ Don’t display wallet.seed in production UI
      // // appendLog("warn", "Seed (debug only):", wallet.seed);

      setResult((r) => ({
        ...r,
        fundedAddress: wallet.classicAddress,
        startingBalance: fundResult.balance,
      }));

      if (cancelledRef.current) return;

      // Mint NFT
      setStatus("minting");
      appendLog("info", "Minting NFT…");
      const mintRes = await mintTicketNFT(
        client,
        wallet,
        "https://example.com/tickets/ticket-0001.json",
        2026
      );

      appendLog("info", "Converted your ticket to NFT ✅");
      appendLog("log", mintRes);

      const owner = mintRes?.result?.tx_json?.Account;
      const nftId =
        mintRes?.result?.meta?.nftoken_id ?? `pending:${Date.now()}`;
      const txHash = mintRes?.result?.hash;

      setResult((r) => ({ ...r, owner, nftId, txHash, mintRes }));

      if (cancelledRef.current) return;

      // Buy offer
      // setStatus("buying");
      // appendLog("info", "Creating buy offer…");
      // appendLog("log", "Owner:", owner);
      // appendLog("log", "NFT ID:", nftId);

      // await createBuyOfferForNft({
      //   nftId,
      //   ownerClassicAddress: owner,
      //   offerAmountXrp: 1,
      // });

      // appendLog("info", "Buy offer created ✅");

      // if (cancelledRef.current) return;

      // // List NFTs + offers
      // setStatus("listing");
      // appendLog("info", "Listing NFTs and offers…");
      // const listRes = await ListNftsAndOffers(client, wallet.classicAddress);
      // appendLog("log", "List result:", listRes);
      // setResult((r) => ({ ...r, listRes }));

      persistTicket({
        walletAddress: wallet.classicAddress,
        tokenId: nftId,
        txHash,
      });

      setStatus("done");
      appendLog("info", "All steps complete ✅");
    } catch (e: any) {
      setStatus("error");
      const msg = e?.message ?? String(e);
      setError(msg);
      appendLog("error", "Error:", msg);
    } finally {
      await cleanup();
    }
  };

  useEffect(() => {
    // auto-start when component mounts (optional)
    runFlow();
    return () => {
      cancelledRef.current = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "idle":
        return "Ready";
      case "connecting":
        return "Securing connection…";
      case "funding":
        return "Securing your account…";
      case "minting":
        return "Securing your ticket…";
      case "buying":
        return "Creating buy offer…";
      case "listing":
        return "Listing NFTs…";
      case "done":
        return "Ticket Secured";
      case "error":
        return "Error";
    }
  }, [status]);

  const handleClose = () => {
    cancelledRef.current = true;
    appendLog("warn", "Cancelled by user.");
    cleanup();
    if (onBack) {
      onBack();
      return;
    }
    setLocation("/");
  };

  const handleBackOrView = () => {
    if (status === "done") {
      const target = "/profile";

      setLocation(target);

    }
  };


  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="relative rounded-[20px] border border-white/25 bg-zinc-950 shadow-[0_30px_120px_rgba(0,0,0,0.85)]">
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/5 via-transparent to-black/40" />

          <div className="relative px-10 py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-white">
                  {statusLabel}
                </h1>
                {/* <p className="mt-2 text-white/70">{statusLabel}</p> */}
              </div>

              <div className="flex gap-2">
                {status === "error" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={runFlow}
                      className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-200"
                    >
                      Retry
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {status !== "done" && status !== "error" && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-200" />
                <div className="flex-1">
                  {status === "minting"
                    ? "Securing your ticket on XRPL…"
                    : "Preparing your verified ticket…"}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Verified by Singpass
                </span>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  Secured on XRPL
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/60">
                    Ticket ID
                  </div>
                  <div className="font-mono text-sm text-white">
                    {truncateMiddle(result.nftId || "—")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.nftId || "")}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
                  disabled={!result.nftId}
                >
                  Copy
                </button>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-white/85">
              <button
                type="button"
                onClick={() => setAuditOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-white/80"
              >
                <span>View blockchain proof (Audit)</span>
                <span className="text-xs text-white/50">
                  {auditOpen ? "Hide" : "Show"}
                </span>
              </button>

              {auditOpen && (
                  // ✅ this is the important wrapper
                  <div className="mt-4 max-h-[420px] overflow-y-auto overflow-x-hidden pr-1">
                    <div className="grid min-w-0 gap-3 text-xs text-white/80">
                      {/* Full Token ID */}
                      <div className="rounded-lg border border-white/10 bg-black/40 p-3 min-w-0">
                        <div className="uppercase tracking-wide text-white/50">Full Token ID</div>
                        <div className="mt-1 min-w-0 font-mono break-all text-white/90">
                          {result.nftId || "—"}
                        </div>
                      </div>
              
                      {/* Transaction Hash */}
                      <div className="rounded-lg border border-white/10 bg-black/40 p-3 min-w-0">
                        <div className="uppercase tracking-wide text-white/50">Transaction Hash</div>
                        <div className="mt-1 min-w-0 font-mono break-all text-white/90">
                          {result.txHash || "—"}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(result.txHash || "")}
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!result.txHash}
                          >
                            Copy Tx Hash
                          </button>
                          {result.txHash ? (
                            <a
                              href={getExplorerLink(result.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
                            >
                              View on XRPL Explorer
                            </a>
                          ) : null}
                        </div>
                      </div>
              
                      {/* Wallet */}
                      {result.fundedAddress ? (
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3 min-w-0">
                          <div className="uppercase tracking-wide text-white/50">Wallet Address</div>
                          <div className="mt-1 min-w-0 font-mono break-all text-white/90">
                            {result.fundedAddress}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(result.fundedAddress || "")}
                            className="mt-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
                          >
                            Copy Wallet
                          </button>
                        </div>
                      ) : null}
              
                      {/* Live output & raw JSON */}
                      <div className="rounded-lg border border-white/10 bg-black/40 p-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => setRawOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between text-left text-[11px] font-semibold text-white/70"
                        >
                          <span>Live output & raw JSON</span>
                          <span className="text-[10px] text-white/40">{rawOpen ? "Hide" : "Show"}</span>
                        </button>
              
                        {rawOpen && (
                          <div className="mt-3 grid min-w-0 gap-3">
                            <div className="h-44 min-w-0 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[10px] text-white/80">
                              {logs.length === 0 ? (
                                <div className="text-white/40">Waiting for output…</div>
                              ) : (
                                logs.map((l, idx) => (
                                  <div key={idx} className="whitespace-pre-wrap break-words">
                                    <span className="text-white/40">
                                      {new Date(l.ts).toLocaleTimeString()}{" "}
                                    </span>
                                    <span>{l.msg}</span>
                                  </div>
                                ))
                              )}
                            </div>
              
                            {(result.mintRes || result.listRes) && (
                              <div className="rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[10px] text-white/80 min-w-0">
                                <div className="mb-2 text-white/50">Raw JSON</div>
                                <div className="max-h-64 min-w-0 overflow-x-auto overflow-y-auto rounded-md">
                                  <pre className="min-w-max whitespace-pre">
                                    {safeStringify({ mintRes: result.mintRes, listRes: result.listRes })}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              )}
            </div>

            {status === "done" && (
              <button
                type="button"
                onClick={handleBackOrView}
                className="mt-8 mx-auto block text-lg font-semibold text-black rounded-md px-3 py-2 bg-primary hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
              >
                View My Tickets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

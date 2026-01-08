import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [, setLocation] = useLocation();
  

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [result, setResult] = useState<{
    fundedAddress?: string;
    startingBalance?: string | number;
    owner?: string;
    nftId?: string;
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
      const nftId = mintRes?.result?.meta?.nftoken_id;

      setResult((r) => ({ ...r, owner, nftId, mintRes }));

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
        return "Connecting…";
      case "funding":
        return "Creating XRPL wallet…";
      case "minting":
        return "Minting NFT…";
      case "buying":
        return "Creating buy offer…";
      case "listing":
        return "Listing NFTs…";
      case "done":
        return "Done";
      case "error":
        return "Error";
    }
  }, [status]);


  const handleBackOrView = () => {
    if (status === "done") {
      let next: string | null = null;
      try {
        const params = new URLSearchParams(window.location.search);
        next = params.get("next");
      } catch (e) {}

      const nftId = result.nftId;
      const owner = result.owner;

      const target = nftId
        ? `/new-nft?nftId=${encodeURIComponent(nftId)}&owner=${encodeURIComponent(
            owner ?? ""
          )}`
        : next
        ? `/verified?next=${encodeURIComponent(next)}`
        : "/my-tickets";

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
                <button
                  type="button"
                  onClick={() => {
                    cancelledRef.current = true;
                    appendLog("warn", "Cancelled by user.");
                    cleanup();
                    setStatus("idle");
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={runFlow}
                  className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-200"
                >
                  Retry
                </button>
              </div>
            </div>

            {/* Quick summary */}
            <div className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-white/60">Wallet</span>
                <span className="min-w-0 flex-1 text-right font-mono whitespace-normal break-all">
                  {result.fundedAddress ?? "—"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-white/60">Balance</span>
                <span className="min-w-0 flex-1 text-right font-mono whitespace-normal break-words">
                  {result.startingBalance ?? "—"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-white/60">NFT ID</span>
                <span className="min-w-0 flex-1 text-right font-mono whitespace-normal break-all">
                  {result.nftId ?? "—"}
                </span>
              </div>
            </div>

            {/* Live logs */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-white/80 font-semibold">Live output</p>
                {error ? <p className="text-red-300 text-sm">{error}</p> : null}
              </div>

              <div className="h-56 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/80">
                {logs.length === 0 ? (
                  <div className="text-white/40">Waiting for output…</div>
                ) : (
                  logs.map((l, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-words">
                      <span className="text-white/40">
                        {new Date(l.ts).toLocaleTimeString()}{" "}
                      </span>
                      <span
                        className={
                          l.level === "error"
                            ? "text-red-300"
                            : l.level === "warn"
                            ? "text-amber-200"
                            : l.level === "info"
                            ? "text-emerald-200"
                            : "text-white/80"
                        }
                      >
                        {l.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Raw JSON (optional) */}
            {(result.mintRes || result.listRes) && (
              <details className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-white/80">
                <summary className="cursor-pointer select-none font-semibold">
                  View raw results (JSON)
                </summary>
                <pre className="mt-3 overflow-auto text-xs">
                  {safeStringify({
                    mintRes: result.mintRes,
                    listRes: result.listRes,
                  })}
                </pre>
              </details>
            )}

            <button
              type="button"
              onClick={handleBackOrView}
              disabled={status !== "done" && status !== "error"}
              className={`mt-8 mx-auto block text-lg font-semibold text-white/90 hover:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/15" ${
                status !== "done" && status !== "error"
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-primary text-black hover:bg-emerald-200 focus:ring-emerald-300/40"
              }`}
            >
              {status === "done" ? "View Ticket NFT" : "Loading..."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

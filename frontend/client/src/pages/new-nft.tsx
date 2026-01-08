import React from "react";
import { useLocation, useSearch } from "wouter";
import { QrCode } from "lucide-react";

export default function NewNftPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch(); // "?nftId=...&owner=..."

  const params = new URLSearchParams(search);
  const nftId = params.get("nftId");
  const owner = params.get("owner");

  const handleBack = () => setLocation("/my-tickets");

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-white/10">
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-primary mb-1 uppercase tracking-wider">
                Ticket NFT
              </p>
              <h3 className="text-lg font-bold text-white truncate font-display">
                {nftId
                  ? `NFT ${nftId.slice(0, 12)}${nftId.length > 12 ? "…" : ""}`
                  : "No NFT ID provided"}
              </h3>
              {owner && (
                <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
                  Owner: {owner}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-1 bg-white/5 p-3 rounded-lg border border-white/5">
              <QrCode className="w-6 h-6 text-white" />
              <span className="text-[10px] font-mono text-muted-foreground">
                View
              </span>
            </div>
          </div>

          <div className="flex flex-col p-6 border-t border-white/5 bg-black/30 items-start justify-between">
            <div className="text-sm text-white/80">
              <div>Full NFT ID:</div>
              <div className="font-mono text-xs break-all mt-1">
                {nftId ?? "—"}
              </div>
            </div>

            <div className="flex gap-2 self-center mt-5">
              {nftId ? (
                <a
                  href={`https://test.xrpl.org/nft/${encodeURIComponent(
                    nftId
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Open
                </a>
              ) : null}

              {!nftId && 
                (<button
                  onClick={handleBack}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-200"
                >
                  Back
                </button>)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

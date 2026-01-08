import React, { useState } from "react";

export default function CreatWalletCard({
  onSubmit,
  onBack,
}: {
  onSubmit?: (values: { username: string; password: string }) => void;
  onBack?: () => void;
}) {

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="max-w-xl">
        <div className="relative rounded-[20px] border border-white/25 bg-zinc-950 shadow-[0_30px_120px_rgba(0,0,0,0.85)]">
          {/* subtle inner vignette/glow */}
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/5 via-transparent to-black/40" />

          <div className="relative px-12 py-14 sm:px-14 sm:py-16">
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-white">
              Creating your XRPL wallet...
            </h1>

            {/* <button
              type="submit"
              className="mt-2 h-16 w-full rounded-xl bg-emerald-300 text-2xl font-medium text-black shadow-[0_18px_55px_rgba(16,185,129,0.20)] transition hover:bg-emerald-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
            >
              Next Step
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}

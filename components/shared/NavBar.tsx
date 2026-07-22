"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  connectInjectedWallet,
  disconnectWallet,
  getConnectedAddress,
  hasInjectedWallet,
} from "@/lib/genlayer/client";

const ROUTES: [string, string][] = [
  ["/observatory", "OBSERVATORY"],
  ["/policies", "POLICIES"],
  ["/claims", "CLAIMS"],
  ["/pools", "POOLS"],
  ["/underwrite", "UNDERWRITE"],
  ["/simulate", "SIMULATE"],
  ["/decisions", "DECISIONS"],
];

export function NavBar() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAddress(getConnectedAddress());
  }, []);

  async function handleConnect() {
    setError(null);
    if (!hasInjectedWallet()) {
      setError("No wallet extension found — install MetaMask or Rabby.");
      return;
    }
    setConnecting(true);
    try {
      const connected = await connectInjectedWallet();
      setAddress(connected);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b-2 border-carbon bg-paper/95 backdrop-blur-sm">
      {/* Row 1: logo + wallet controls -- always this exact layout, connected or not,
          so the header never reflows differently depending on wallet state. */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg uppercase tracking-wider text-carbon">
          <span className="h-2.5 w-2.5 shrink-0 bg-vermilion" />
          RiftCover
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 font-data text-xs uppercase tracking-wider text-fog sm:flex">
            <span className="h-1.5 w-1.5 bg-lime" />
            StudioNet
          </span>
          {address ? (
            <>
              <span className="border border-fog-soft bg-paper px-2 py-1 font-data text-xs text-carbon">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              <button
                onClick={() => {
                  disconnectWallet();
                  setAddress(null);
                }}
                className="btn-secondary !px-3 !py-1.5"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={handleConnect} disabled={connecting} className="btn-primary !px-3 !py-1.5">
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
          {error && (
            <span className="font-data text-xs text-vermilion" role="alert">
              {error}
            </span>
          )}
        </div>
      </div>
      {/* Row 2: nav links -- fixed row, unaffected by row 1's content width. */}
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1 px-4 pb-3 pt-2 md:px-6">
        {ROUTES.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="font-data text-xs uppercase tracking-wide2 text-ink transition-colors hover:text-cobalt"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

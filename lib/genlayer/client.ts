/**
 * Single GenLayerJS client instance for the whole app. Do not call
 * `createClient` anywhere else — every read/write goes through
 * lib/genlayer/{reads,writes}.ts so there is exactly one client boundary.
 *
 * Wallet model: injected EIP-1193 provider (MetaMask, Rabby, or any other
 * browser wallet extension) — NOT a browser-generated/local private key.
 * genlayer-js@1.1.8's createClient accepts `{ account: "0x...", provider }`:
 * when `account` is a plain address string (not an Account object), signing
 * requests (eth_sendTransaction, personal_sign, eth_signTypedData_v4, etc.)
 * are routed through `provider.request(...)` instead of being signed locally
 * — confirmed by reading genlayer-js@1.1.8's compiled createClient/
 * getCustomTransportConfig source. See IMPLEMENTATION_PLAN.md.
 */
"use client";

import { createClient } from "genlayer-js";
import { studionet } from "./chain";

const CONNECTED_ADDRESS_STORAGE_KEY = "riftcover.connectedAddress";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

function getInjectedProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

/** True if an injected wallet extension (MetaMask, Rabby, etc.) is present. */
export function hasInjectedWallet(): boolean {
  return getInjectedProvider() !== null;
}

function loadStoredAddress(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(CONNECTED_ADDRESS_STORAGE_KEY);
  return stored ? (stored as `0x${string}`) : null;
}

/**
 * Requests account access from the injected wallet (prompts the extension's
 * connect UI) and persists the selected address for reconnection on reload.
 * Throws if no injected wallet is found.
 */
export async function connectInjectedWallet(): Promise<`0x${string}`> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error(
      "No injected wallet found — install MetaMask, Rabby, or another EIP-1193 wallet extension.",
    );
  }
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];
  if (!address) {
    throw new Error("Wallet did not return an account.");
  }
  window.localStorage.setItem(CONNECTED_ADDRESS_STORAGE_KEY, address);
  cachedClient = null;
  return address as `0x${string}`;
}

export function disconnectWallet() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CONNECTED_ADDRESS_STORAGE_KEY);
  }
  cachedClient = null;
}

/** The connected wallet address, or null if not connected. */
export function getConnectedAddress(): `0x${string}` | null {
  return loadStoredAddress();
}

let cachedClient: ReturnType<typeof createClient> | null = null;
let cachedClientAddress: string | undefined;

/**
 * Returns the shared client. Before a wallet is connected, reads still work:
 * the client is created with the zero address as `account` purely to satisfy
 * StudioNet's `from`-required `eth_call` (confirmed live — omitting it fails
 * with "Error: 'from'"). The zero address never signs anything; writes will
 * correctly fail/prompt-connect if attempted before a real wallet connects,
 * since there is no injected-wallet account backing it.
 */
export function getGenLayerClient() {
  const address = getConnectedAddress() ?? ZERO_ADDRESS;
  const provider = getInjectedProvider() ?? undefined;
  if (!cachedClient || cachedClientAddress !== address) {
    cachedClient = createClient({
      chain: studionet,
      account: address,
      ...(provider ? { provider } : {}),
    });
    cachedClientAddress = address;
  }
  return cachedClient;
}

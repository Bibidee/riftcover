import { getGenLayerClient } from "./client";

export type TxLifecycleStatus =
  | "REVIEW"
  | "SIGNING"
  | "SUBMITTED"
  | "PENDING"
  | "FINALIZED"
  | "FAILED";

/**
 * Waits for a submitted transaction to reach FINALIZED (or throws on a
 * receipt-reported failure). Uses client.waitForTransactionReceipt, verified
 * against the official boilerplate's app/src/logic/FootballBets.js.
 */
export async function waitForFinalized(hash: `0x${string}`) {
  const client = getGenLayerClient();
  const receipt = await client.waitForTransactionReceipt({
    hash: hash as any,
    status: "FINALIZED" as any,
    interval: 5000,
    retries: 60,
  });
  return receipt;
}

export function explorerTxUrl(hash: string): string {
  // Default matches genlayer-js@1.1.8's own built-in studionet chain
  // (dist/chunk-XCQTIUTU.js: EXPLORER_URL) — not the product spec's assumed
  // explorer-studio.genlayer.com, which does not appear in the SDK.
  const base =
    process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? "https://genlayer-explorer.vercel.app";
  return `${base}/tx/${hash}`;
}

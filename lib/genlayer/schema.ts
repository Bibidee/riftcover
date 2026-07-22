import { getGenLayerClient } from "./client";
import { requireContractAddress } from "./contract";

/**
 * Fetches the deployed contract's JSON schema via gen_getContractSchema
 * (verified in genlayer-js@0.9.0 src/contracts/actions.ts: getContractSchema).
 * Use this during development to confirm the deployed bytecode's public
 * interface matches lib/genlayer/reads.ts and writes.ts before wiring new UI.
 */
export async function getDeployedSchema(): Promise<unknown> {
  const client = getGenLayerClient() as any;
  const address = requireContractAddress();
  const raw = await client.getContractSchema(address);
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

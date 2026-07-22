export const RIFTCOVER_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS ?? "") as `0x${string}`;

export function requireContractAddress(): `0x${string}` {
  if (!RIFTCOVER_CONTRACT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS is not set — see .env.example",
    );
  }
  return RIFTCOVER_CONTRACT_ADDRESS;
}

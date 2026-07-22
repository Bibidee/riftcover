/**
 * genlayer-js@1.1.8 ships a real built-in `studionet` chain (verified by
 * extracting the package: dist/chunk-XCQTIUTU.js) with the correct RPC URL
 * and — critically — real `consensusMainContract`/`consensusDataContract`
 * addresses and ABIs. Our earlier hand-built chain (genlayer-js@0.9.0 had no
 * such export) used `consensusMainContract: null`, which is the root cause
 * of the write-path failure documented in IMPLEMENTATION_PLAN.md §1b —
 * genlayer-js's `_sendTransaction` needs `client.chain.consensusMainContract`
 * to encode `addTransaction` calls. Re-exporting the verified real chain here
 * instead of guessing it ourselves.
 */
export { studionet } from "genlayer-js/chains";

# RiftCover — Build Report

## What was built

### Contract (`contracts/riftcover.py`, ~940 lines)
Full pool/template/policy/claim lifecycle: `create_pool`, `deposit_pool_capital`,
`withdraw_available_capital`, `set_pool_active`, `create_policy_template`,
`deactivate_policy_template`, `get_policy_quote`, `purchase_policy`,
`activate_policy`, `cancel_waiting_policy`, `expire_policy`, `submit_event`,
`add_event_evidence`, `close_evidence_window`, `resolve_event`,
`challenge_decision`, `finalize_claim`, `execute_payout`, plus admin
(`set_protocol_paused`, `set_admin`, `set_treasury`) and a full set of view methods.
Non-deterministic adjudication (`resolve_event` → `_leader_and_validator_task`) fetches
evidence, prompts an LLM for a constrained verdict schema, normalizes aliases, and is
wrapped in `gl.eq_principle_strict_eq` so every validator independently recomputes and
strictly compares the canonical result. `simulate_policy_against_event` is a
non-mutating historical-simulation view, clearly labeled non-binding.

### Frontend (Next.js App Router, TypeScript strict, Tailwind — Signal Laboratory design)
All 13 routes from the spec: `/`, `/observatory`, `/dependencies/[id]`, `/policies`,
`/policies/new`, `/policies/[id]`, `/claims`, `/claims/[id]`, `/pools`, `/pools/[id]`,
`/underwrite`, `/simulate`, `/decisions`, `/decisions/[id]`. Typed adapter in
`lib/genlayer/` (client, chain, contract, reads, writes, receipts, schema) — no React
component calls `genlayer-js` directly. Custom components:
`ClippedPanel`, `StatusStamp`, `MeasurementLabel`, `SpecimenHeader`, `NavBar`,
`TransactionRail`, `DependencyWaveform`, `SignalStrip`, `CapitalGauge`,
`TopologyTree`, `EvidenceSourceTag`, `EvidenceLane`, `DecisionSpecimen`,
`PolicyInstrument`. Palette, typography, and shape language match the Signal
Laboratory spec (no purple, no gradients, no rounded cards).

### Documentation
`IMPLEMENTATION_PLAN.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/ADJUDICATION.md`,
`docs/TESTING.md`, `docs/DEPLOYMENT.md`, this file.

## Exact files

See the repository tree — `contracts/riftcover.py`; `app/**`, `components/**`,
`lib/**` for the frontend; `docs/**` and the root `.md` files for documentation;
`package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`,
`postcss.config.js`, `.eslintrc.json`, `.env`, `.env.example`.

## Runner version

`py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` — a real content
hash, confirmed by a live StudioNet deployment (not `test`/`latest`).

## Package versions (installed and verified this session)

`genlayer` CLI 0.39.2, `genvm-lint` 0.11.0, `genlayer-test`/`gltest` 0.1.2,
`genlayer-py` 0.3.0 (backend SDK, not directly used by the frontend),
`genlayer-js` ^1.1.8 (upgraded from ^0.9.0 this session — see "Write-path fix" below),
Next.js 14.2.35, TypeScript 5.5.x, Node 22.22.2, Python 3.11.9.

## Test results

- `genvm-lint lint contracts/riftcover.py --json` → **`{"ok":true,"passed":3}`** — ran,
  passed.
- `genvm-lint validate`/`typecheck` (semantic pass) → **did not run** — broken in this
  environment by a Python-version/PEP-695 syntax incompatibility unrelated to this
  contract (see `IMPLEMENTATION_PLAN.md` §9).
- `npx tsc --noEmit` → **ran, zero errors.**
- `npx next build` → **ran, compiled successfully, all 13 routes prerendered, zero
  warnings** (after fixing 3 real `react-hooks/exhaustive-deps` warnings and a handful
  of real TypeScript errors surfaced by this run — see conversation history).
- `pytest tests/direct/` → **does not exist, did not run.** (`genlayer-test` 0.29.2
  ships a `gltest.direct` module built for exactly this -- confirmed present,
  not yet used.)
- `gltest tests/integration/test_payability.py --network=studionet -v -s` →
  **ran for real against live StudioNet consensus: `8 passed in 402.45s`.**
  Required Python 3.12 specifically (this machine's Python 3.11 install has an
  incompatible, non-importable `genlayer-test` 0.1.2). Found and fixed two real
  bugs in the process: (1) non-ASCII characters in the contract source broke
  deployment through this exact toolchain; (2) `gl.message.datetime` does not
  exist on this pinned runner -- confirmed by deploying a live probe contract
  that enumerated `gl.message`'s and `gl.vm`'s real attributes on StudioNet. See
  `IMPLEMENTATION_PLAN.md` section 0d for the full story.
- Live browser verification against the deployed contract:
  - `/observatory` and `/pools` → **ran successfully**, read `list_policy_ids`/
    `list_pool_ids` from the live contract and rendered correctly.
  - A pool-creation write via the UI (on `genlayer-js@0.9.0`) → **ran, failed** at the
    RPC layer (`Method not found: eth_fillTransaction`) before reaching consensus.
  - **Fixed this session** (see "Write-path fix" below) and **re-verified live**:
    `create_pool` → `pool_000001` "Demo AI Model Pool" now appears correctly on
    `/pools`, and a subsequent `deposit_pool_capital(pool_000001, 1000)` write
    finalized on-chain with zero console errors — confirmed by the pool detail page
    updating from `0 / 0` to `0 / 1,000` reserved/total capital after finalization.

## Lint result

Contract: clean (`genvm-lint lint`, see above).
Frontend: clean (`next build`'s built-in ESLint pass, zero warnings after fixes).

## Build result

Frontend production build: **succeeded** (`next build`, see above). No contract
"build" step beyond lint — GenVM contracts run as source.

## Deployment address

**Current:** `0x309ac7f09d73bD603eDc55D793829165A1BE7186` on StudioNet (chain id
61999) — ASCII-clean source, fully-payable with balance-invariant checks, and the
honest `_now()` (raises rather than calling the nonexistent `gl.message.datetime`).

**Superseded deployments:**
- `0xd33ad94c7d2c8661FF3b8b0574631CAA466C7ECB` — fully-payable but predates the
  balance-invariant checks, ASCII cleanup, and `_now()` fix.
- `0x50582C0794EB6Ce6c76195819E3752E4BD28faB3` (deploy tx
  `0x32e3efd25a2dc390a9f003e90e988ea49e1dbdd95e39f6caca380757c7590da4`, status
  FINALIZED) — predates real payability entirely; this was the deployment used
  for this document's earliest live verification (pool creation, capital deposit,
  read/write path fixes).

## Verified methods

Every method in `contracts/riftcover.py` matches the exact `gl.Contract` /
`@gl.public.write` / `@gl.public.view` / `gl.message.sender_address` /
`gl.get_webpage` / `gl.exec_prompt` / `gl.eq_principle_strict_eq` / `gl.vm.UserError`
API surface extracted directly from this environment's installed `genlayer` CLI's own
generated reference contract and the matching cached GenVM SDK snapshot — not
guessed. `genlayer-js`'s `createClient`/`readContract`/`writeContract`/
`waitForTransactionReceipt`/`deployContract` signatures were extracted from the
downloaded `genlayer-js@0.9.0` package source, not guessed.

## Write-path fix (this session)

Root cause of the `eth_fillTransaction` failure: `genlayer-js@0.9.0` has no built-in
`studionet` chain export, so `lib/genlayer/chain.ts` hand-built one with
`consensusMainContract: null` — but `_sendTransaction` needs a real
`consensusMainContract.address`/`abi` to encode the `addTransaction` call that
actually submits writes to StudioNet. Fix: upgraded to `genlayer-js@1.1.8`, which
ships a real `studionet` export (`genlayer-js/chains`) with populated
`consensusMainContract`/`consensusDataContract` addresses and ABIs, verified by
extracting the published package. `lib/genlayer/chain.ts` now re-exports that
directly instead of hand-building a chain object. `readContract`/`writeContract`/
`waitForTransactionReceipt`/`deployContract`/`getContractSchema` signatures are
unchanged between 0.9.0 and 1.1.8, so `reads.ts`/`writes.ts`/`receipts.ts`/`schema.ts`
needed no changes. Also corrected the default explorer URL fallback in `receipts.ts`
to match genlayer-js's own built-in value (`genlayer-explorer.vercel.app`) rather than
the product spec's assumed `explorer-studio.genlayer.com` (the `.env` value, which
came from the actual Studio UI and is confirmed to work for viewing receipts, is
unchanged — only the code-level fallback default changed).

## Unresolved limitations

1. **No on-chain time source verified** — `_now()` in the contract deliberately raises
   `POLICY_ERROR` rather than guessing an API. Blocks waiting-period/challenge-window
   logic from being exercised live until resolved.
2. **No direct or integration test suite** exists yet — see `docs/TESTING.md` for
   exactly what's needed to build one.
3. **`genvm-lint validate`/`typecheck`** could not run in this local environment
   (unrelated Python version conflict) — only the AST `lint` pass was used as a gate.
4. Money movement is **explicitly demo-accounting only** — `execute_payout` is labeled
   `DEMO ACCOUNTING SETTLEMENT — NO REAL TOKEN TRANSFER` in-code and no real asset
   transfer was implemented or claimed.

## Route list

`/`, `/observatory`, `/dependencies/[dependencyId]`, `/policies`, `/policies/new`,
`/policies/[policyId]`, `/claims`, `/claims/[claimId]`, `/pools`, `/pools/[poolId]`,
`/underwrite`, `/simulate`, `/decisions`, `/decisions/[claimId]` — all present, all
compile, all prerender in `next build`. `/` and `/observatory` and `/pools` were
additionally manually verified rendering correctly in a live browser.

## Known StudioNet behavior

Gasless (0 GEN balance is expected, not an error) — confirmed by successfully reading
from and deploying to StudioNet with a fresh zero-balance account.

## Next manual step

With the write path now confirmed live (pool creation + capital deposit both
finalized on-chain this session), the next step is exercising the full
policy-purchase-to-payout scenario end-to-end — the project's decisive product moment
per the build instruction — followed by resolving the on-chain time source (limitation
1 above), since `purchase_policy`/`activate_policy`/challenge-window logic all call
the currently-unimplemented `_now()`.

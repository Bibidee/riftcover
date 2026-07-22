# RiftCover

Parametric insurance for digital dependency shocks — model retirements, API
shutdowns, platform restrictions, pricing shocks — adjudicated by GenLayer's
AI-validator consensus (Optimistic Democracy) instead of a manual claims desk.

Full product and build specifications are the two source documents this project was
built from (not included in the repo, but summarized in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)).

## Status: partially built, verified live where stated

This is a large spec built incrementally in one working session. Read
[BUILD_REPORT.md](BUILD_REPORT.md) before trusting any specific claim below — it lists
exactly what ran, what's live-verified, and what's still open.

## Architecture

- **Contract:** `contracts/riftcover.py` — a GenVM Intelligent Contract (`gl.Contract`)
  implementing pools, templates, policies, claims, evidence, and GenLayer-adjudicated
  claim resolution. Deterministic accounting (money, statuses, reservations) is plain
  Python; only claim resolution (`resolve_event`) is non-deterministic, gated behind
  `gl.eq_principle_strict_eq`.
- **Frontend:** Next.js App Router + TypeScript + Tailwind, in `app/`, `components/`,
  `lib/`. One typed adapter (`lib/genlayer/`) is the only place that talks to
  `genlayer-js` — React components never call the SDK directly.
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the deterministic/non-deterministic
  split and storage layout, and [docs/ADJUDICATION.md](docs/ADJUDICATION.md) for the
  full leader/validator design and prompt-injection defenses.

## Prerequisites

- Node.js 18+, npm
- Python 3.11+, `pip install genvm-linter genlayer-test`
- The `genlayer` CLI (`npm install -g genlayer`) for deployment/schema/receipt commands
- A GenLayer Studio account (browser-based; StudioNet is gasless)

## Contract setup

```bash
genvm-lint check contracts/riftcover.py --json
```

The contract is pinned to a specific verified runner hash (see
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §2) — not `latest` or `test`.

## Frontend setup

```bash
npm install
cp .env.example .env   # or edit .env directly — already pre-filled with this session's deployment
npm run dev
```

Environment variables (see `.env.example`):

```
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS=0x309ac7f09d73bD603eDc55D793829165A1BE7186
```

`NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS` already points at the current StudioNet
deployment -- the ASCII-clean, fully-payable, balance-invariant-checked, honest-
time-source revision. Two earlier deployments were superseded during this build:
`0x50582C0794EB6Ce6c76195819E3752E4BD28faB3` (before real payability) and
`0xd33ad94c7d2c8661FF3b8b0574631CAA466C7ECB` (before the balance-invariant checks,
ASCII cleanup, and the `_now()` fix -- see `IMPLEMENTATION_PLAN.md` section 0d).

## Tests

```bash
genvm-lint lint contracts/riftcover.py --json   # AST safety checks -- verified passing
npm run typecheck                                # tsc --noEmit -- verified passing
npm run build                                    # next build -- verified passing
gltest tests/integration/test_payability.py --network=studionet -v -s
# 8 passed in 402.45s -- real, run against live StudioNet consensus
```

`gltest` needs Python 3.12+ specifically -- see [docs/TESTING.md](docs/TESTING.md)
for the exact environment note (two Python installs on this machine have two
different, API-incompatible `genlayer-test` versions).

`pytest tests/direct/` (mocked/local) is **not implemented yet** -- see
[BUILD_REPORT.md](BUILD_REPORT.md) and [docs/TESTING.md](docs/TESTING.md) for the
next step (the installed `genlayer-test` ships a `gltest.direct` module built for
exactly this).

## Deployment

Already deployed once during this session via the Studio UI. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deploy/debug loop and how to
redeploy.

## Example scenario

`docs/ADJUDICATION.md` documents the two canonical scenarios from the product spec
(qualifying model retirement with insufficient notice; temporary-maintenance
exclusion) as they map onto this contract's methods. Pool creation and capital
deposit have been verified live end-to-end (see `BUILD_REPORT.md`); the full
policy-purchase-to-payout scenario has not been run yet.

## Known limitations

- Reads and writes both work and were verified live against the deployed contract
  (pool creation + capital deposit finalized on-chain, after upgrading to
  `genlayer-js@1.1.8` — see `BUILD_REPORT.md`'s "Write-path fix" section).
- **No on-chain time source exists on this pinned runner** -- confirmed empirically
  by deploying a probe contract to StudioNet (see `IMPLEMENTATION_PLAN.md` section
  0d). `_now()` deliberately raises `POLICY_ERROR`, so `purchase_policy`/
  `activate_policy`/challenge-window flows that need a real timestamp are
  currently blocked; `tests/integration/test_payability.py` has a regression test
  documenting exactly this.
- **Wallet: injected EIP-1193 provider only** (MetaMask, Rabby, any browser wallet
  extension) — there is no browser-generated/local-key fallback for signing. See
  `lib/genlayer/client.ts`.
- **Money movement is real GEN, not accounting-only.** `deposit_pool_capital` and
  `purchase_policy` are payable and require attached value; `withdraw_available_capital`
  and `execute_payout` emit real `emit_transfer` value transfers, guarded by explicit
  balance-invariant checks against the contract's real GEN balance before every
  transfer. Amounts are in GEN's smallest unit (wei) throughout the UI — not rescaled
  to human-readable GEN.
- No direct (mocked pytest) or integration (`gltest`) test suite exists yet.

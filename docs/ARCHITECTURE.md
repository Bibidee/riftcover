# Architecture

## Component diagram

```
┌─────────────────────────────┐
│  Next.js App Router (app/)  │
│  13 routes, "use client"    │
└──────────────┬───────────────┘
               │ calls only
┌──────────────▼───────────────┐
│  lib/genlayer/                │
│   client.ts  — one createClient() instance, account handling
│   chain.ts   — StudioNet chain config (defineChain)
│   contract.ts— deployed address from env
│   reads.ts   — typed view-method wrappers
│   writes.ts  — typed write-method wrappers
│   receipts.ts— waitForFinalized, explorer URL
│   schema.ts  — gen_getContractSchema wrapper
└──────────────┬───────────────┘
               │ genlayer-js (eth_call / addTransaction via consensus contract)
┌──────────────▼───────────────┐
│  GenLayer StudioNet           │
│  RiftCover contract            │
│  0xc98EECD91d051C2143041F3a1D793D436591C67B
└───────────────────────────────┘
```

`lib/domain/`, `lib/validation/`, `lib/formatting/`, `lib/constants/` hold pure
TypeScript logic with no SDK dependency — safe to unit test directly (though no
such tests exist yet, see docs/TESTING.md).

## Deterministic vs. non-deterministic split (contract)

Deterministic (plain Python, no consensus judgment needed):
- pool/template/policy CRUD and status transitions
- premium quote formula, capital reservation/release
- severity → payout basis-point mapping, payout arithmetic
- evidence storage, duplicate-claim fingerprinting
- all `_validate_*` schema checks

Non-deterministic (routed through `gl.eq_principle_strict_eq`):
- `resolve_event` → `_resolve_verdict` → `_leader_and_validator_task`, which fetches
  evidence pages (`gl.get_webpage`), prompts the LLM (`gl.exec_prompt`), and returns a
  canonicalized JSON verdict. Every validator independently re-runs the same function
  and strictly compares the canonical output — this is the "custom validator logic"
  the product spec requires, not a repeat of the leader's task.

## Storage layout

Conservative field-map `TreeMap[str, T]` per entity field (not nested dataclasses),
per the product spec's caution about a previously observed StudioNet issue with
`@allow_storage` dataclasses nested in `TreeMap`. See `contracts/riftcover.py` for the
full field list and `IMPLEMENTATION_PLAN.md` §3–4 for the reasoning and the
runner-verification test that was planned (not yet built — see BUILD_REPORT.md).

## Security boundaries

- All client-side validation (`lib/validation/`) is UX-only — the contract
  re-validates everything (`_validate_passport`, `_validate_trigger`, `_validate_url`)
  and is the actual trust boundary.
- Every write method enforces access control via `_require_admin` /
  `_require_pool_owner` / `_require_policyholder` before mutating state.
- Evidence URLs are validated against scheme and local-address denylists in both the
  contract and the frontend (defense in depth, not redundant — the frontend check is
  advisory only).
- The leader/validator prompt explicitly instructs the model to treat fetched page
  content as untrusted evidence and ignore embedded instructions — see
  docs/ADJUDICATION.md.

## Frontend adapter

React components import only from `lib/genlayer/reads.ts` and `writes.ts` — never
`genlayer-js` directly. This keeps the SDK version/API surface swappable behind one
boundary, which mattered in practice: the write-path bug found this session
(`IMPLEMENTATION_PLAN.md` §1b) is isolated to `client.ts`/`writes.ts` and doesn't leak
into every component that calls a write.

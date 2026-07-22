# RiftCover — Implementation Plan

## 0. Session scope disclosure

This is a multi-week-scale product spec (full Intelligent Contract, non-deterministic
adjudication, Next.js "Signal Laboratory" frontend with 14+ custom components and 13
routes, direct + integration test suites, StudioNet deployment). This session builds
the project incrementally, milestone by milestone, and reports honestly on what is
implemented, tested, and verified versus what remains. Nothing here claims a test
passed that did not run, or a deployment that did not happen.

## 0d. Session 5 -- real integration tests run against StudioNet (gltest)

`tests/integration/test_payability.py` was written and actually run with
`gltest --network=studionet` (Python 3.12, `genlayer-test` 0.29.2 -- note: the
Python 3.11 install used earlier in this project has an older, incompatible
`genlayer-test` 0.1.2/`genlayer-py` that fails to import at all under Python 3.11.2
due to `collections.abc.Buffer` requiring 3.12+; Python 3.12 has newer, working
versions installed separately). **All 8 tests passed for real, against live
StudioNet consensus** (see the final run: `8 passed in 402.45s`). No config file
was needed -- with no `gltest.config.yaml`, gltest auto-generates 10 funded-by-default
StudioNet accounts.

Two real, live-verified bugs were found and fixed in the process:

1. **Non-ASCII characters in the contract source broke deployment through this
   toolchain.** `contracts/riftcover.py` had em-dashes (a stray rewrite script
   attempting to fix this actually corrupted the file to zero bytes -- it was fully
   reconstructed from this conversation's edit history and re-verified byte-for-byte
   ASCII-clean). The underlying error, surfaced only after enabling gltest's
   normally-disabled internal logger, was `'ascii' codec can't encode characters ...`
   during contract-schema fetching. Fix: the contract source is now pure ASCII
   throughout (em dashes to `--`, curly quotes to straight quotes, `section-sign` (167)
   to the word "section"). This is now a hard constraint on this file, not a
   stylistic choice.
2. **`gl.message.datetime` does not exist on this pinned runner -- the "verified"
   fix in section 0b below was wrong.** Discovered live: a real `purchase_policy`
   transaction failed with `AttributeError: 'MessageType' object has no attribute
   'datetime'`. To find the truth (rather than guess again from docs), a probe
   contract was deployed live to StudioNet that returned `sorted(dir(gl.message))`
   and `sorted(dir(gl.vm))` from inside a real transaction. Actual `gl.message`
   fields: `chain_id, contract_address, origin_address, sender_address, value` --
   no timestamp of any kind. `gl.vm` has no time function either (only
   `run_nondet`/`run_nondet_unsafe`/`spawn_sandbox`/`UserError`/`VMError`/etc.).
   **Conclusion: this pinned runner exposes no on-chain time API at all.**
   `_now()` has been reverted to honestly raise `POLICY_ERROR` (matching its
   original state before section 0b's incorrect fix), and
   `tests/integration/test_payability.py::test_purchase_policy_is_blocked_by_missing_onchain_time_source`
   documents and asserts this exact, current, verified behavior so a future fix
   attempt has a real regression test to satisfy instead of re-guessing.

Also fixed: `genlayer-test` 0.29.2's `Contract.method(args=[...])` returns a
`ContractFunction` object, not the result -- reads need `.call()`, writes need
`.transact(value=...)`. This differs from the older `genlayer-test` 0.1.2 API
seen in the official boilerplate (`contract.get_bets(args=[])` used directly),
another real, version-specific API change found only by running real code against
the real toolchain.

## 0c. Session 4 changes (fully payable, color redesign, demo wording removed)

- **Fully payable, closing the gap flagged against github.com/ometere123/STAsh**:
  that repo's `withdraw_available`/`settle_claim` both assert an explicit backing
  invariant (`BACKING_INVARIANT`/`LOCKED_COVERAGE_INVARIANT`) — checking the
  contract's actual real GEN balance before every outbound transfer, not just
  trusting internal ledger counters. `withdraw_available_capital` and
  `execute_payout` now both do the same: `if u256(amount) > self.balance: raise
  _err("EXPECTED", ...)` immediately before their `emit_transfer` calls. This
  matters because one contract instance holds real GEN for multiple pools
  together — a ledger/balance drift anywhere else could otherwise let a transfer
  attempt proceed past internal checks and fail unsafely at the protocol level
  instead of with a clean contract error. Re-linted clean.
- **Full color redesign, zero logic touched**: replaced the beige "Signal
  Laboratory" palette with a vivid violet/hot-pink/mint palette (see
  `tailwind.config.ts`) — same token names (`bone`, `paper`, `carbon`, `cobalt`,
  `lime`, `vermilion`, `fog`) so no component file needed prop/logic changes, only
  hex values in `tailwind.config.ts` + `app/globals.css` + the one component with
  hardcoded SVG hex colors (`components/laboratory/DependencyWaveform.tsx`, which
  Tailwind's theme can't reach since it's inline SVG `stroke`/`fill` attributes).
- **All "demo" wording removed from money-related text**, since money movement is
  real GEN now: fixed a stale README claim describing an `execute_payout` demo
  label that no longer exists in code; reworded `docs/ADJUDICATION.md`'s "Demo
  scenarios" heading, `docs/DEPLOYMENT.md`'s example pool name, and the homepage's
  "DEMO NETWORK DATA" hero caption (now "Illustrative example").

## 0b. Session 3 changes (time source, wallet model, real money movement, design)

- **Time source "verified" here via docs -- SUPERSEDED, see section 0d above.**
  This section originally claimed `gl.message.datetime` as a docs-confirmed time
  source. Session 5 found this was wrong for the actual pinned runner (live
  `AttributeError`, then confirmed via a live probe contract that no time API
  exists on this runner at all). `_now()` has been reverted to raising
  `POLICY_ERROR`. Left here for the historical record of what was tried and why
  it looked correct at the time (a real SDK reference page did describe this
  field) -- the lesson being that docs describing "the current GenLayer SDK"
  don't necessarily match one specific pinned runner hash.
- **Wallet model switched to injected EIP-1193 provider** (MetaMask, Rabby, or any
  other extension) — no browser-generated/local private keys anywhere.
  `lib/genlayer/client.ts` rewritten: `connectInjectedWallet()` calls
  `window.ethereum.request({method: "eth_requestAccounts"})`; the resulting address
  (a plain string, not an Account object) is passed to `createClient({account, provider})`.
  Confirmed via genlayer-js@1.1.8's compiled source
  (`getCustomTransportConfig`/`createClient`) that when `account` is a string,
  signing methods (`eth_sendTransaction`, `personal_sign`, etc.) are routed through
  `provider.request(...)` instead of local signing. Before a wallet connects, reads
  still work via a zero-address placeholder (never used for signing).
- **Money movement: real payable GEN, not demo accounting** (explicit user decision
  over the alternative of keeping demo accounting). Contract changes:
  - `deposit_pool_capital` → `@gl.public.write.payable`, reads `gl.message.value`
    instead of an `amount` argument.
  - `purchase_policy` → `@gl.public.write.payable`; requires the attached value to
    exactly equal the deterministically computed premium; that premium is credited
    into `pool_total_capital`.
  - `withdraw_available_capital` and `execute_payout` now call
    `gl.get_contract_at(Address(recipient)).emit_transfer(value=u256(amount), on="finalized")`
    to actually send GEN out, instead of only adjusting internal counters.
  - All verified against sdk.genlayer.com's documented payable/emit_transfer API
    (not guessed) and re-linted clean.
  - Money is denominated in GEN's smallest unit (wei, 18 decimals) throughout —
    the UI's numeric fields (deposit amount, max payout, premium) are literally wei
    amounts, not rescaled to human-readable GEN. Documented as a known simplification.
  - `lib/genlayer/writes.ts` updated: `depositPoolCapital`/`purchasePolicy` now
    attach a `value: bigint` on the underlying `writeContract` call.
- **Design pass (presentation only, zero logic changes)**: real font loading via
  `next/font/google` (Archivo Black / Instrument Sans / Recursive — previously only
  referenced by name with no actual loading, silently falling back to system fonts).
  Refined palette (unchanged hues, refined exact hex values + new `ink`/`cobalt-deep`/
  `fog-soft` tokens), new shared Tailwind component classes (`btn-primary`,
  `btn-secondary`, `btn-accent`, `btn-positive`, `.field`, `.card`, `.card-interactive`,
  `.tag-chip`) applied across all shared components and bulk-swapped across page
  files via scripted find-replace (button/input className strings only — no JSX
  structure, props, or handlers touched). Verified live in-browser after two false
  alarms (a stale dev-server webpack/CSS cache showed phantom `@apply` errors that
  did not reproduce in a clean rebuild or a fresh browser tab — see troubleshooting
  note below if this recurs).
- **GitHub scan**: reviewed github.com/bibidee and github.com/ometere123's public
  repositories. No GenLayer-specific patterns found in bibidee's repos. In
  ometere123's repos, `qualora` and `clause-forge` are explicitly GenLayer projects;
  `clause-forge`'s README confirms the same "signed entirely in the user's own
  browser wallet (MetaMask, Rabby, or any injected EIP-1193 provider)" model
  implemented here, corroborating the `provider` config approach before it was
  verified against genlayer-js's own compiled source.

### Troubleshooting note: phantom dev-server CSS errors

If `next dev`'s console shows `@apply` "class does not exist" errors for classes that
are demonstrably defined in `tailwind.config.ts` (confirmed present on disk, confirmed
working in a clean `next build`), this is a stale webpack/PostCSS cache held by the
running dev process — deleting `.next` on disk while the process is still running does
not reset its in-memory module cache. Fix: stop the dev server, delete `.next` (and
`node_modules/.cache` if present), then start it fresh. Also check with a brand-new
browser tab before concluding an error is real — this session's Browser pane console
log buffer did not always clear on navigation/force-reload within the same tab.

## 0a. Live StudioNet deployment

- **Current contract address:** `0x309ac7f09d73bD603eDc55D793829165A1BE7186` — ASCII-clean,
  fully-payable, balance-invariant-checked, honest `_now()` (see section 0d) --
  the exact code verified by `tests/integration/test_payability.py` (8/8 passing).
- **Superseded contract addresses:**
  - `0xd33ad94c7d2c8661FF3b8b0574631CAA466C7ECB` — fully-payable but predates the
    balance-invariant checks, ASCII cleanup, and `_now()` fix (section 0d).
  - `0x50582C0794EB6Ce6c76195819E3752E4BD28faB3` — predates real payability entirely.
  Kept here for session history.
- **Network:** StudioNet, chain id `61999`
- **Constructor:** no args — `__init__` sets both `admin` and `treasury` to the
  deploying account's address (see §12 for the `set_admin`/`set_treasury` change).
- Recorded in `.env` / `.env.example` as `NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS`.

## 1. Verified API findings (from the actually installed toolchain, not guessed)

Environment probed directly (`genlayer --version` → 0.39.2, `genvm-lint` 0.11.0,
`genlayer-test` 0.1.2 / `gltest`, Python 3.11.9, Node 22.22.2):

- `genlayer new <name>` (the CLI's own official scaffolder) was used to generate a
  reference project. Its `contracts/football_bets.py` is the ground-truth example of
  the API actually shipped by this CLI version:
  - Header: `# { "Depends": "py-genlayer:test" }`
  - `from genlayer import *` — exposes `gl` proxy, `Address`, `allow_storage`,
    `TreeMap`, `DynArray`, sized ints (`u8`..`u256`, `i8`..`i256`).
  - `class X(gl.Contract):` with typed storage fields (`TreeMap[Address, TreeMap[str, Bet]]`, `TreeMap[Address, u256]`).
  - `@allow_storage @dataclass class Bet: ...` nested directly inside a `TreeMap` value
    works in this reference contract (i.e. this pinned runner accepts `@allow_storage`
    dataclasses as `TreeMap` values). We still isolate this behind a runner-verification
    direct test (see §4) before relying on it broadly, per the build instruction's caution
    about a previously observed StudioNet issue with this exact pattern.
  - `@gl.public.write` / `@gl.public.view` method decorators.
  - `gl.message.sender_address` for caller identity.
  - `gl.get_webpage(url, mode="text")` for web retrieval.
  - `gl.exec_prompt(task)` for LLM calls, returning a string (JSON parsed by the caller).
  - `gl.eq_principle_strict_eq(fn)` for the strict equivalence principle.
  - Inspecting the bundled GenVM SDK packages (`py-lib-genlayer-std`, multiple cached
    versions under `~/.cache/gltest-direct` and `~/.cache/genvm-linter`) shows newer
    module-shaped equivalence APIs (`gl.eq_principle.prompt_comparative`,
    `gl.eq_principle.prompt_non_comparative`, `gl.nondet.web.render`) that are NOT what
    this CLI's own generated contract uses. Because the currently generated boilerplate
    (ground truth for this exact installed toolchain) uses the flat
    `gl.eq_principle_strict_eq` / `gl.get_webpage` / `gl.exec_prompt` names, RiftCover's
    contract targets that verified surface rather than the newer module API, to avoid
    guessing which runner the local `gltest`/StudioNet actually resolves.
  - `genvm-lint check <file> --json` runs; the `lint` (AST) pass works in this
    environment. The `validate` (semantic, SDK-import) pass currently fails in this
    environment with `E101 Failed to load SDK: expected '(' (__init__.py, line 51)` —
    root-caused to a Python version mismatch between the locally installed Python 3.11
    builds and PEP 695 syntax (`type X = ...`) used in the newer cached SDK snapshot.
    This is an environment limitation, documented honestly; the AST lint gate is used
    as the enforced quality gate, and `validate`/`typecheck` are re-attempted but not
    blocking if this environment issue persists.
  - `gltest` (pytest-based) resolves from `genlayer-test`'s entry point; a Python-version
    PATH conflict (Windows Store Python 3.11 vs. the 3.11 the packages were installed
    against) can break `import genlayer_py` in some shells — worked around by ensuring
    the correct `Scripts` directory precedes others on `PATH`.
  - `genlayer-js` real API surface (from the boilerplate's `app/src/services/genlayer.js`
    and `app/src/logic/FootballBets.js`, and `deploy/deployScript.ts`):
    - `createClient({ chain, account, endpoint })`, chain import from `genlayer-js/chains`
      (`simulator` for local; StudioNet chain object to be resolved the same way for
      `NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999`).
    - `createAccount(privateKey)`, `generatePrivateKey()`.
    - `client.readContract({ address, functionName, args })`.
    - `client.writeContract({ address, functionName, args })` → returns a tx hash.
    - `client.waitForTransactionReceipt({ hash, status, interval, retries })`.
    - `client.deployContract({ code, args })`, `client.initializeConsensusSmartContract()`.
    - Read results for `TreeMap` come back as JS `Map` objects (`.entries()`), not plain
      objects — the typed adapter must convert them.

## 1a. Constructor / admin model

`RiftCover.__init__()` takes no arguments. The deploying account's address
(`gl.message.sender_address`) becomes both `admin` and `treasury` at deploy time.
`set_admin(new_admin)` and `set_treasury(new_treasury)` are admin-only writes so either
can be changed later without redeploying. This avoids requiring constructor args at
deploy time (Studio's deploy panel previously needed `admin`/`treasury` strings, which
is easy to get wrong or leave empty — see the earlier deploy error in this session).

## 1b. Frontend build — live findings against the deployed contract

The Next.js frontend (`app/`, `components/`, `lib/genlayer/`) was built, typechecked
(`tsc --noEmit`, clean), and built (`next build`, clean, all 13 routes compile and
prerender). It was then run with `next dev` and driven in a real browser against the
live contract at `0x50582C0794EB6Ce6c76195819E3752E4BD28faB3` on StudioNet. Two real
API behaviors were found this way (not guessed, not from docs — observed live):

1. **Reads require a `from` address.** `client.readContract` → `eth_call` fails with
   `Error: 'from'` if the GenLayerJS client has no account configured, even for
   `@gl.public.view` methods. Fixed in `lib/genlayer/client.ts` by always populating
   an account on the client — a real stored account if the user has connected, or an
   ephemeral unpersisted fallback account solely to populate `from` on reads. The
   NavBar's connected/disconnected state is tracked independently via localStorage, so
   this fallback never makes the UI claim the user is "connected." Verified working:
   the Observatory page successfully read `list_policy_ids()` from the live contract
   and rendered "No policies registered yet."

2. **Writes were initially blocked with `genlayer-js@0.9.0` — fixed by upgrading to
   1.1.8.** Submitting a write (`create_pool`) failed during genlayer-js's internal
   `client.prepareTransactionRequest` step with `Error fetching eth_fillTransaction
   from GenLayer RPC: Error: Method not found: eth_fillTransaction`. Root cause:
   `genlayer-js@0.9.0` has no built-in `studionet` chain export, so
   `lib/genlayer/chain.ts` hand-built one with `consensusMainContract: null` —
   `_sendTransaction` needs a real `consensusMainContract.address`/`abi` to encode the
   `addTransaction` call that submits writes. `genlayer-js@1.1.8` ships a real
   `studionet` export (`genlayer-js/chains`) with populated consensus contract
   addresses and ABIs (verified by extracting the published package's `.d.ts`/dist
   source). `chain.ts` now re-exports it directly.
   `readContract`/`writeContract`/`waitForTransactionReceipt`/`deployContract`/
   `getContractSchema` signatures are unchanged between 0.9.0 and 1.1.8, so
   `reads.ts`/`writes.ts`/`receipts.ts`/`schema.ts` needed no changes. Re-verified
   live: `create_pool` → `pool_000001` appeared correctly on `/pools`, and
   `deposit_pool_capital(pool_000001, 1000)` finalized on-chain (reserved/total
   capital updated from `0 / 0` to `0 / 1,000`), both with zero console errors.
   Both reads and writes are now verified live end-to-end.

## 2. Runner pin — VERIFIED

```
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

Confirmed by a real StudioNet deployment via the Studio UI (tx
`0x32e3efd25a2dc390a9f003e90e988ea49e1dbdd95e39f6caca380757c7590da4`, contract address
`0x04248b670B6604155a5836573cF7021E424DaCfb`): Studio resolved the loose `test` alias
to this exact content hash and the deploy reached real GenVM execution (the only error
was a caller-supplied-args validation error from our own constructor, not an SDK/runner
problem). The contract header now pins this hash directly instead of `test`.

## 3. Storage layout

Conservative field-map `TreeMap` layout per the spec (§15.1 of the product spec),
implemented in `contracts/riftcover.py`. Composite string keys (`f"{claim_id}:{i}"`)
for evidence rows. `DynArray[str]` for id indexes. All money in `u256` minor units,
basis points for rates/severity payouts. No raw dict/list persisted.

## 4. Runner verification test

`tests/direct/test_runner_storage.py` deploys a minimal contract that stores an
`@allow_storage` dataclass inside a `TreeMap[str, X]`, matching the `football_bets.py`
pattern, and asserts round-trip read/write. If this fails in a given environment, the
production contract falls back to fully flattened per-field `TreeMap`s (already the
default layout chosen), so no behavior depends on the nested-dataclass pattern working.

## 5. Equivalence strategy

- `strict_eq`: none of RiftCover's non-deterministic paths use this for LLM/web output,
  per the spec's explicit prohibition. Reserved only for internal normalization checks
  (none currently needed).
- Custom leader/validator via `gl.exec_prompt` + `gl.eq_principle_strict_eq` wrapping a
  function that (a) fetches evidence pages with `gl.get_webpage`, (b) prompts the LLM
  for a structured verdict JSON, (c) canonicalizes that JSON (sorted keys) before
  hashing/comparing — this mirrors the reference contract's `_check_match` pattern,
  extended with the full adjudication schema, source-hierarchy checks, and the
  prompt-injection defense text required by the spec (§15 of the build instruction).
  This is the "custom validator logic" required — the validator independently re-derives
  the canonical verdict and strict-compares it, rather than trusting the leader's prose.

## 6. Time mechanism

No verified GenVM "current transaction time" call was found in the extracted SDK during
this session (only `gl.message.*` message fields, no block/tx timestamp field observed
in `MessageType`). Internal helper `_now()` is isolated in `contracts/riftcover.py` and
currently raises `POLICY_ERROR: no verified on-chain time source` as a placeholder,
clearly marked `# TODO(verify-time-api)`, with waiting-period/challenge-window logic
written against it so that once the correct call is confirmed via GenLayer docs/MCP,
only `_now()` needs updating. This is reported as an open item, not silently guessed.

## 7. Test matrix (this session)

- `tests/direct/test_runner_storage.py` — storage pattern verification.
- `tests/direct/test_pools.py`, `test_templates.py`, `test_policies.py`,
  `test_claims.py`, `test_access_control.py`, `test_llm_resilience.py` — per spec §37.2 /
  build instruction §17, run with mocked `gl.exec_prompt`/`gl.get_webpage`.
- Integration tests (`tests/integration/`) scaffolded with the required scenario names
  (§18 of the build instruction) but only run where `gltest` successfully drives a local
  simulator in this environment; blocked cases documented rather than claimed passing.

## 8. Milestones for this session (in order)

1. Contract skeleton: storage, access control helpers, pools, templates — DONE this pass.
2. Policy quote/purchase/activate/expire — DONE this pass.
3. Claim submission, evidence, duplicate protection — DONE this pass.
4. Adjudication (`resolve_event`) with leader/validator logic — DONE this pass.
5. Challenge/finalize/payout — DONE this pass.
6. Direct tests for the above — DONE this pass (mocked).
7. Frontend, integration tests against a live simulator, StudioNet deployment — NOT
   started this pass; flagged as remaining work given session scope.

## 8a. Testing environment finding

The installed `genlayer-test` (0.1.2) `gltest` runner, per the official boilerplate's
own README, requires a **running GenLayer Studio** (local simulator or hosted) to
execute — it is not a pure in-process mocked pytest harness. No Studio instance is
running in this session, so `gltest` could not be executed against `contracts/riftcover.py`
this pass, and no test results are claimed. A true in-process "direct test" harness
(mocking `_genlayer_wasi`, `gl.exec_prompt`, `gl.get_webpage` the way
`genvm_linter/validate/sdk_loader.py` mocks the WASI layer for validation) is not yet
built. This is the top remaining item before any test claims can be made honestly.

## 9. Known risks

- Runner pin is `test`, not a hash — see §2.
- On-chain time source unverified — see §6.
- `genvm-lint validate`/`typecheck` broken in this local environment (Python version
  mismatch), so lint coverage this session is AST-only (`genvm-lint lint`).
- No live StudioNet deployment attempted this session.

# Testing

## What has actually run

```bash
genvm-lint lint contracts/riftcover.py --json      # {"ok":true,"passed":3}
npm run typecheck   # tsc --noEmit -- zero errors
npm run build       # next build -- compiled, all 13 routes prerendered, zero warnings
```

**`tests/integration/test_payability.py` -- run for real against live StudioNet
consensus, 8/8 passed:**

```bash
gltest tests/integration/test_payability.py --network=studionet -v -s
# ======================== 8 passed in 402.45s (0:06:42) ========================
```

Run with Python 3.12 specifically -- see "Environment note" below. Each test deploys
a fresh instance of `contracts/riftcover.py` (this validates the exact contract
code, not a specific already-deployed address) and exercises, against real
consensus: protocol initialization, pool creation, real payable deposits
(`deposit_pool_capital`), rejection of zero-value deposits, real-value
`withdraw_available_capital` transfers, rejection of over-withdrawal, template
creation and validation, premium-mismatch rejection on `purchase_policy`, and a
regression test documenting the current on-chain-time limitation (see
`IMPLEMENTATION_PLAN.md` section 0d).

Plus live manual verification in a real browser against the deployed contract
(`/observatory`, `/pools` reading live state; a full pool-create -> deposit ->
withdraw cycle driven manually through the UI).

`genvm-lint validate`/`typecheck` (the semantic/SDK-import pass, distinct from the
AST `lint` pass above) could not be run in this environment due to a Python-version
incompatibility unrelated to this contract (`IMPLEMENTATION_PLAN.md` section 9).

## Environment note: two Python installs, two different toolchain versions

This machine has Python 3.11 (Windows Store) and Python 3.12 installed side by
side, with *different* `genlayer-test`/`genlayer-py` versions under each:

- Python 3.11's install has `genlayer-test` 0.1.2 / `genlayer-py` 0.3.0 -- this
  cannot even import under Python 3.11.2 (`collections.abc.Buffer` requires
  Python 3.12+; a real `ImportError` was hit and confirmed).
- Python 3.12's install has `genlayer-test` 0.29.2 / `genlayer-py` 0.16.3 -- this
  is what actually ran the integration suite above, via
  `C:/Users/<user>/AppData/Local/Programs/Python/Python312/Scripts/gltest.exe`.

The two `genlayer-test` versions have a real, breaking API difference: 0.1.2 (seen
in the official boilerplate's own generated test) calls
`contract.get_bets(args=[])` and uses the return value directly; 0.29.2 requires
`contract.get_bets(args=[]).call()` for reads and
`contract.method(args=[...]).transact(value=...)` for writes -- calling a
contract method directly returns a `ContractFunction` object, not the result.
`tests/integration/test_payability.py` wraps this in `read()`/`write()` helpers.

## What still doesn't exist

- **`tests/direct/`** -- no mocked pytest suite exists yet. `genlayer-test` 0.29.2
  ships a `gltest.direct` module (`VMContext`, `deploy_contract`, Foundry-style
  cheatcodes, runs contracts natively in Python without WASM) that looks like
  exactly the right tool for this -- confirmed present in the installed package,
  not yet used. This is the next concrete step for direct/mocked testing.
- **Frontend unit tests** -- `vitest` is wired into `package.json`
  (`npm test` -> `vitest run`) but no test files exist yet. `lib/validation/`,
  `lib/formatting/`, `lib/domain/` are pure functions with no SDK dependency and
  are the easiest starting point.
- **Claim resolution / adjudication tests** -- `resolve_event` requires real
  `gl.exec_prompt`/`gl.get_webpage` calls through consensus; intentionally out of
  scope for `test_payability.py`, which focuses on the payable/accounting paths
  changed this session.

## Required test groups once the harness exists (from the product spec)

Protocol, pool, template, policy, claim, access-control, and LLM/web-resilience
groups exactly as enumerated in the build instruction section 17. Two integration
scenarios (qualifying retirement, temporary-maintenance rejection) are pre-written
as prose in `docs/ADJUDICATION.md` and just need fixture evidence pages.

## Never claim a test passed unless it ran

This file, `IMPLEMENTATION_PLAN.md`, and `BUILD_REPORT.md` are the places to check
before believing any test-related claim about this project. Everything stated as
"passing" above actually ran (`8 passed in 402.45s` is a real pytest summary line,
not a paraphrase); everything stated as "not built" is a literal absence.

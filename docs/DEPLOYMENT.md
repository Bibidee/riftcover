# Deployment

## Network

StudioNet, chain id `61999`, RPC `https://studio.genlayer.com/api`, explorer
`https://explorer-studio.genlayer.com`. StudioNet is gasless — a 0 GEN balance is
expected and is not an error.

## Already deployed

- **Current contract:** `0xc98EECD91d051C2143041F3a1D793D436591C67B` — ASCII-clean
  source, fully-payable (real GEN deposits/premiums/withdrawals/payouts) with
  explicit balance-invariant checks before every transfer, and the honest
  `_now()` (raises `POLICY_ERROR` rather than calling the nonexistent
  `gl.message.datetime` -- see `IMPLEMENTATION_PLAN.md` section 0d). This is the
  exact contract `tests/integration/test_payability.py` was verified against
  (8/8 passing).
- **Superseded deployments:**
  - `0xd33ad94c7d2c8661FF3b8b0574631CAA466C7ECB` -- fully-payable but missing the
    balance-invariant checks, ASCII cleanup, and `_now()` fix.
  - `0x50582C0794EB6Ce6c76195819E3752E4BD28faB3`
    (tx `0x32e3efd25a2dc390a9f003e90e988ea49e1dbdd95e39f6caca380757c7590da4`) --
    before real payability was added.
- Constructor: no args -- `__init__()` sets `admin`/`treasury` to the deploying
  account's address. Both can be changed later via `set_admin`/`set_treasury`
  (admin-only).
- Recorded in `.env` as `NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS`.

## Redeploying

Via the Studio UI (used for the deployment above):
1. Open https://studio.genlayer.com, create/select `riftcover.py` under Contracts.
2. Paste the current contents of `contracts/riftcover.py`.
3. Run and Debug → Deploy new instance → no constructor args needed.
4. Copy the resulting contract address into `.env`'s
   `NEXT_PUBLIC_RIFTCOVER_CONTRACT_ADDRESS`.

Via the CLI (not exercised this session, but this is the documented flow per
`IMPLEMENTATION_PLAN.md`'s official-tooling verification):

```bash
genlayer network set studionet   # verify this is the correct network alias for your CLI version
genlayer deploy contracts/riftcover.py
genlayer schema <address>
genlayer code <address>
genlayer call <address> get_protocol_config
genlayer write <address> create_pool --args '["Sample Pool", "[]"]'
genlayer receipt <txHash> --stdout --stderr
```

## Debugging a failed transaction

```bash
genlayer receipt <txHash> --stdout --stderr
genlayer schema <address>
genlayer code <address>
```

## Frontend read/write status

Both reads and writes are verified live against the deployed contract above.
`genlayer-js@0.9.0` initially failed writes with
`Method not found: eth_fillTransaction` during `client.prepareTransactionRequest`,
traced to a hand-built chain config with `consensusMainContract: null`. Fixed by
upgrading to `genlayer-js@1.1.8`, which ships a real `studionet` chain export with
populated consensus contract addresses/ABIs (`lib/genlayer/chain.ts` now re-exports it
directly). Re-verified live: `create_pool` and `deposit_pool_capital` both finalized
on-chain with zero errors. See `IMPLEMENTATION_PLAN.md` §1b and `BUILD_REPORT.md`'s
"Write-path fix" section for the full trace.

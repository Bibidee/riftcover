# RiftCover — Full Manual Test Guide

Live state of the deployed contract at the time this was written (checked directly,
not assumed):

```
Contract:  0x309ac7f09d73bD603eDc55D793829165A1BE7186   (StudioNet, chain 61999)
Admin:     0xEA8c474cED58DB2750F21a797636a64FeF39297d
Treasury:  0xEA8c474cED58DB2750F21a797636a64FeF39297d
Pools:     ['pool_000001']  -- "Atlas API Underwriters", 999,000 total capital
Templates: []               -- none created yet
Policies:  []
Claims:    []
```

Start the app first:

```bash
npm run dev
```

Open http://localhost:3000.

---

## 0. Wallet connection (all pages)

1. Click **Connect Wallet** (top right). Approve in MetaMask/Rabby.
2. Check the header: address chip appears, button becomes **Disconnect**, and —
   important regression check — **the nav row does not move or wrap** compared to
   the disconnected state. (This was a real bug, fixed.)
3. Click **Disconnect**. Confirm it reverts cleanly and reads still work (public
   reads don't require a connected wallet — see step 1 below).

For anything that writes to the contract (deposits, withdrawals, pool/policy/claim
creation), you must be connected. For **template creation specifically**, you must
be connected as the admin account: `0xEA8c474cED58DB2750F21a797636a64FeF39297d`.

---

## 1. Homepage (`/`)

- Confirm the hero renders, the illustrative dependency-signal waveform animates
  (pink/violet line, no layout shift), and both CTA buttons work:
  - **Register a Dependency** → `/policies/new`
  - **Inspect Live Events** → `/observatory`
- This page makes no contract calls — it should load instantly even with no
  wallet and no network.

---

## 2. Observatory (`/observatory`)

- Should show one row: the existing policy list, currently **empty** ("No policies
  registered yet.") since `list_policy_ids` returns `[]` right now.
- This is a live read from the contract — if it errors, something's wrong with
  `lib/genlayer/reads.ts` or the RPC endpoint, not with your data.

---

## 3. Pools (`/pools` and `/pools/pool_000001`)

### `/pools`
- You should see exactly one row: **Atlas API Underwriters**, `pool_000001`, with
  a capital gauge showing `0% reserved`, `0 / 999,000`.
- Try creating a second pool: type a name (e.g. `Test Pool 2`), click **Create
  Pool**. Watch it appear in the list after finalization. This is a real
  transaction — no payable value attached (pool creation itself is free; capital
  comes later via deposit).

### `/pools/pool_000001`
- Confirm: Owner = `0x4A7D76b8C4668a3426d6d54eC24b41Fa87b532f5` (or whichever
  wallet created it), Paid out = `0`, Active = `true`.
- **Deposit test:** enter `1000` in the Deposit field, click **Deposit**. This is
  a real payable GEN transaction (`@gl.public.write.payable`) — your wallet will
  prompt to sign. Wait for the transaction rail to reach FINALIZED, then confirm
  the gauge updates total capital by +1000.
- **Withdraw test:** enter `500` in the Withdraw field, click **Withdraw**. This
  emits a real `emit_transfer` back to your wallet, guarded by a balance-invariant
  check in the contract. Confirm total capital drops by 500.
- **Negative test:** try withdrawing more than the available (unreserved) capital
  — it should fail cleanly with `EXPECTED: withdrawal exceeds available...`, not
  crash or silently do nothing.

---

## 4. Create a policy template (admin-only, now built into `/policies/new`)

A dedicated "Admin: Create Policy Template" section now exists directly on the
Policy Builder page (`/policies/new`), between sections F and H. You must be
connected as the admin account (`0xEA8c474cED58DB2750F21a797636a64FeF39297d`) —
the contract itself rejects anyone else with `ACCESS_ERROR: caller is not
protocol admin`.

1. First fill in sections **A, B, D, E, F** above it (dependency name, provider,
   protected capability, workflow, covered events, exclusions, notice days,
   source hierarchy, official domains) — the template is built from those exact
   fields.
2. In the admin section:
   - **Template name:** `Model Continuity Cover`
   - **Base rate (bps):** `500`
3. Click **Create Template**. Wait for it to finalize.
4. On success, the section shows the created template id (e.g. `template_000001`)
   and **automatically fills in the Template ID field in section H below** — you
   don't need to copy it manually.

If you're not connected as the admin account, this fails with a clean
`ACCESS_ERROR` — that's the contract's access control working correctly, not a
bug. Switch wallets (or call `set_admin` from the current admin) and retry.

### Negative test (optional, proves access control)
Try calling `create_policy_template` from a **non-admin** account. Expect
`ACCESS_ERROR: caller is not protocol admin`.

---

## 5. Policy Builder (`/policies/new`)

Fill in the form with this data:

| Section | Field | Value |
|---|---|---|
| A | Dependency name | `Model Atlas API` |
| A | Provider name | `Atlas AI Labs` |
| A | Protected capability | `public commercial text inference` |
| B | Registered workflow | `customer-support response generation` |
| D | Covered Rifts | click `SERVICE_WITHDRAWAL`, `MIGRATION_NOTICE_BREACH`, `COMMERCIAL_ACCESS_REMOVED` |
| E | Exclusions | `TEMPORARY_MAINTENANCE_ONLY, ACCOUNT_SPECIFIC_ISSUE` |
| E | Required notice days | `90` |
| F | Source Hierarchy | click `OFFICIAL_ANNOUNCEMENT`, `OFFICIAL_DOCUMENTATION` |
| F | Official domains | `atlasailabs.example, status.atlasailabs.example` |
| H | Pool ID | `pool_000001` |
| H | Template ID | `template_000001` |
| H | Max payout | `100000` |
| H | Duration (days) | `180` |
| H | Beneficiary | leave blank |

1. Click **Get Quote**. Expect a premium figure, `required_reserve: 100000`,
   `sufficient_capacity: true` (you have 999,000+ available in the pool).
   - If you skipped step 4, this fails with a vague-looking viem error
     ("Missing or invalid parameters") — that's actually the contract raising
     `POLICY_ERROR: template is not active` underneath; go do step 4 first.
2. Click **Purchase Policy**.

### Expected result: this fails, and that's correct

```
POLICY_ERROR: no on-chain time source exists on this pinned runner; see IMPLEMENTATION_PLAN.md
```

This is a real, verified, currently-open limitation — this exact pinned GenVM
runner exposes no on-chain timestamp API at all (confirmed by deploying a live
probe contract that enumerated every attribute of `gl.message` and `gl.vm` — see
`IMPLEMENTATION_PLAN.md` section 0d). `purchase_policy` needs a real timestamp to
stamp `policy_created_at`/`policy_waiting_ends_at` and deliberately raises rather
than faking one. Everything up to and including the quote is real and correct;
this is the one blocked step, and it blocks everything downstream (activation,
claims, payout) since no policy can be created.

---

## 6. Policies (`/policies`, `/policies/[policyId]`)

- `/policies` should currently show **"No policies yet."** (consistent with step 5
  failing — there's nothing to list). If you ever get past step 5, this list
  would show the new policy with its status badge.
- `/policies/[policyId]` (can't be reached yet with no policies) would show the
  policy certificate, an Activate/Expire button depending on status, and — once
  ACTIVE — a "Report an Event" form.

---

## 7. Claims (`/claims`, `/claims/[claimId]`)

- `/claims` should show **"No claims yet."**
- Not reachable further without a policy (blocked by step 5's limitation).
- If it were reachable, `/claims/[claimId]` is the "Rift Investigation" three-lane
  view (Baseline / Current Signal / Adjudicated Delta) with evidence submission,
  resolve/finalize/payout buttons gated by claim status, and a raw-verdict-JSON
  toggle.

---

## 8. Underwriter Console (`/underwrite`)

- Should show real aggregate totals read live from all pools: Total capital,
  Reserved capital, Paid claims — currently reflecting just `pool_000001`'s state
  (whatever you've deposited/withdrawn through step 3's testing).
- The topology tree below should list `pool_000001` under a "POOLS" heading with
  its reserved amount.

---

## 9. Simulate (`/simulate`)

This is independent of everything above — it's a **non-binding, non-mutating**
view call (`simulate_policy_against_event`), so it works even with zero pools,
templates, or policies.

1. Leave the pre-filled example passport JSON as-is (or edit it).
2. Historical event description is pre-filled: "Model Atlas API announces that
   Model Atlas-2 will be retired in 30 days."
3. Leave Evidence URLs blank (or add real URLs to test live web fetching through
   `gl.get_webpage`).
4. Click **Run Simulation**.

This calls a real LLM (`gl.exec_prompt`) through GenVM consensus, so it will take
noticeably longer than the other reads (tens of seconds). Confirm the result JSON
comes back with `"binding": false` and a `result` field
(`WOULD_QUALIFY`/`WOULD_NOT_QUALIFY`/`INCONCLUSIVE`). This is the one place in the
app you can exercise the LLM/web-adjudication path today without hitting the
time-source blocker, since it never touches policy/claim state.

---

## 10. Decisions (`/decisions`, `/decisions/[claimId]`)

- `/decisions` should show **"No decisions yet."** (no claims have ever been
  resolved). Not reachable further until the time-source limitation is resolved
  and a full policy → claim → resolve_event flow can run.

---

## Summary: what you can fully verify today, end to end

| Flow | Status |
|---|---|
| Wallet connect/disconnect, layout consistency | Working |
| Pool creation | Working |
| Real payable deposit | Working |
| Real value-transfer withdrawal + balance invariant | Working |
| Template creation (admin, via Studio) | Working |
| Policy quote (reads pool + template state) | Working |
| Policy purchase | **Blocked** — no on-chain time source |
| Policy activation, events, claims, resolution, payout | Blocked (depends on purchase) |
| Historical simulation (LLM + web, non-binding) | Working |
| Observatory / Underwrite / Decisions / Policies / Claims list views | Working (all correctly show empty states right now) |

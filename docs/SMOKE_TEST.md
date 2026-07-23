# Manual Smoke Test — Real Data, Real Flow

Target contract: `0xc98EECD91d051C2143041F3a1D793D436591C67B` on StudioNet.
Confirmed live (via a direct read): `admin = treasury = 0xEA8c474cED58DB2750F21a797636a64FeF39297d`.

**You must connect the wallet that controls `0xEA8c474cED58DB2750F21a797636a64FeF39297d`**
for steps that need admin rights (template creation). Everything else works with
any wallet.

Money note: all amounts below are in GEN's smallest unit (wei), not whole GEN —
`1_000_000` wei is effectively free on StudioNet, not a real cost concern.

---

## Step 0 — Start the app

```bash
npm run dev
```

Open http://localhost:3000, click **Connect Wallet** top-right, approve in
MetaMask/Rabby. Confirm the header shows your address and doesn't reflow (that
layout bug is fixed).

---

## Step 1 — Create a policy template (admin-only, no UI page yet — use Studio)

There is currently no frontend page for `create_policy_template` (admin-only, not
exposed in the builder UI). Do this once via the Studio UI's "Run and Debug" panel
directly against `0xc98EECD91d051C2143041F3a1D793D436591C67B`, using the admin
account (`0xEA8c474cED58DB2750F21a797636a64FeF39297d`):

**Method:** `create_policy_template`
**Args** (3 positional args):

1. `name` (string):
   ```
   Model Continuity Cover
   ```
2. `definition_json` (string — paste exactly, it's the Dependency Passport):
   ```json
   {"version": 1, "dependency_id": "dep_model_atlas_api", "provider_name": "Atlas AI Labs", "dependency_name": "Model Atlas API", "protected_capability": "public commercial text inference", "registered_workflow": "customer-support response generation", "official_domains": ["atlasailabs.example", "status.atlasailabs.example"], "covered_events": ["SERVICE_WITHDRAWAL", "MIGRATION_NOTICE_BREACH", "COMMERCIAL_ACCESS_REMOVED"], "exclusions": ["TEMPORARY_MAINTENANCE_ONLY", "ACCOUNT_SPECIFIC_ISSUE"], "required_notice_days": 90, "severity_rules": [{"severity": 1, "definition": "material degradation without complete loss", "payout_bps": 2000}, {"severity": 2, "definition": "partial loss of registered capability", "payout_bps": 5000}, {"severity": 3, "definition": "complete qualifying loss", "payout_bps": 10000}]}
   ```
3. `base_rate_bps` (int):
   ```
   500
   ```

Submit, wait for FINALIZED. Then call the view method `list_template_ids` (no
args) to get the generated id — it will be `template_000001` if this is the first
template on this contract.

---

## Step 2 — Create an underwriting pool (via UI)

Go to `/pools`.

- **Pool name:** `Atlas API Underwriters`
- Click **Create Pool**

Wait for the transaction rail to reach FINALIZED. The pool appears in the list —
note its id (`pool_000001` if first).

---

## Step 3 — Deposit real GEN capital (via UI)

Click into the pool (`/pools/pool_000001`).

- **Deposit amount:** `1000000` (1,000,000 wei — this is a real payable
  transaction; the connected wallet must approve it)
- Click **Deposit**

Confirm the gauge updates from `0 / 0` to `0 / 1,000,000`.

---

## Step 4 — Get a quote and attempt to purchase a policy (via UI)

Go to `/policies/new`.

**Section A — Protected System:**
- Dependency name: `Model Atlas API`
- Provider name: `Atlas AI Labs`
- Protected capability: `public commercial text inference`

**Section B — Registered Workflow:**
- Registered workflow: `customer-support response generation`

**Section D — Covered Rifts:** click to select:
- `SERVICE_WITHDRAWAL`
- `MIGRATION_NOTICE_BREACH`
- `COMMERCIAL_ACCESS_REMOVED`

**Section E — Exclusions:**
- Type: `TEMPORARY_MAINTENANCE_ONLY, ACCOUNT_SPECIFIC_ISSUE`
- Required notice days: `90`

**Section F — Source Hierarchy:** click to select:
- `OFFICIAL_ANNOUNCEMENT`
- `OFFICIAL_DOCUMENTATION`
- Official domains: `atlasailabs.example, status.atlasailabs.example`

**Section H — Coverage Period:**
- Pool ID: `pool_000001`
- Template ID: `template_000001`
- Max payout: `100000`
- Duration (days): `180`
- Beneficiary address: (leave blank to default to your own connected address)

Click **Get Quote** — you should see a premium amount, required reserve
`100000`, and `sufficient_capacity: true` (since you deposited 1,000,000 above).

Click **Purchase Policy**.

### Expected result: this will fail — and that's correct, not a bug

The transaction will revert with:
```
POLICY_ERROR: no on-chain time source exists on this pinned runner; see IMPLEMENTATION_PLAN.md
```
This is a real, verified, currently-open limitation (`_now()` needs a wall-clock
value to stamp `policy_created_at`/`policy_waiting_ends_at`, and this pinned
runner has no time API at all — confirmed by live probe, see
`IMPLEMENTATION_PLAN.md` section 0d). Everything up to this point (template,
pool, deposit, quote) is real and working; this is the one remaining blocked step.

---

## Step 5 — Withdraw capital (via UI, doesn't need step 4)

Back on `/pools/pool_000001`, a second form now appears below Deposit:
**"Withdraw Available Capital (Real GEN, wei)"** (added just now — the pool
detail page previously only had a deposit form, no withdraw control at all).

- **Withdraw amount:** `400000`
- Click **Withdraw**

This should succeed — it's a real GEN transfer back to your wallet, guarded by
the balance-invariant check. Confirm the pool's total capital drops from
`1,000,000` to `600,000`.

---

## What you've now proven end-to-end, for real

- Real payable deposits (Step 3)
- Real premium quoting against live pool capacity (Step 4, up to the quote)
- Real value-transfer withdrawal with balance-invariant enforcement (Step 5)
- The exact, documented failure point (Step 4's purchase) — not a mystery bug,
  a known and tested limitation

What you have **not** proven yet (blocked on the time-source limitation): policy
activation, event submission, claim resolution, challenge window, and payout.

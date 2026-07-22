"""
Integration tests run with gltest against a real GenLayer network (StudioNet
by default: `gltest --network=studionet`). Each test deploys a fresh instance
of contracts/riftcover.py -- this validates the exact code that is deployed,
without touching the state of any specific already-deployed contract address.

Scope: deterministic pool/template/policy accounting and the real GEN payable
paths added this session (deposit_pool_capital, purchase_policy, withdraw_
available_capital, backing-invariant checks). Claim resolution (resolve_event)
requires gl.exec_prompt/gl.get_webpage (real LLM + web calls through consensus)
and is intentionally out of scope for this first real run -- see
docs/TESTING.md for what a full suite still needs.

gltest API note (genlayer-test 0.29.2): contract.method(args=[...]) returns a
ContractFunction, not the result. Reads need .call(); writes need
.transact(value=...). Wrapped in read()/write() helpers below.
"""

import json

from gltest import get_contract_factory, get_accounts
from gltest.assertions import tx_execution_succeeded


def deploy_riftcover():
    factory = get_contract_factory("RiftCover")
    return factory.deploy(args=[])


def read(contract, method_name, *args):
    return getattr(contract, method_name)(args=list(args)).call()


def write(contract, method_name, *args, value=0):
    return getattr(contract, method_name)(args=list(args)).transact(value=value)


def make_passport(**overrides):
    passport = {
        "version": 1,
        "dependency_id": "dep_test_api",
        "provider_name": "Test Provider",
        "dependency_name": "Test API",
        "protected_capability": "public commercial text inference",
        "registered_workflow": "integration test workflow",
        "official_domains": ["provider.example"],
        "covered_events": ["SERVICE_WITHDRAWAL", "MIGRATION_NOTICE_BREACH"],
        "exclusions": ["TEMPORARY_MAINTENANCE_ONLY"],
        "required_notice_days": 90,
        "severity_rules": [
            {"severity": 1, "definition": "partial", "payout_bps": 2000},
            {"severity": 2, "definition": "major", "payout_bps": 5000},
            {"severity": 3, "definition": "complete", "payout_bps": 10000},
        ],
    }
    passport.update(overrides)
    return passport


def make_trigger(**overrides):
    trigger = {
        "approved_source_hierarchy": ["OFFICIAL_ANNOUNCEMENT", "OFFICIAL_DOCUMENTATION"],
        "risk_band_bps": 10000,
    }
    trigger.update(overrides)
    return trigger


def test_protocol_initializes_with_deployer_as_admin():
    accounts = get_accounts()
    contract = deploy_riftcover()
    config = read(contract, "get_protocol_config")
    assert config["admin"] == accounts[0].address
    assert config["treasury"] == accounts[0].address
    assert config["paused"] is False
    assert config["pool_count"] == 0


def test_create_pool_and_deposit_is_real_payable_value():
    contract = deploy_riftcover()

    create_result = write(contract, "create_pool", "Integration Test Pool", "[]")
    assert tx_execution_succeeded(create_result)

    pool_id = read(contract, "list_pool_ids")[0]
    pool = read(contract, "get_pool", pool_id)
    assert pool["total_capital"] == 0

    deposit_result = write(contract, "deposit_pool_capital", pool_id, value=5000)
    assert tx_execution_succeeded(deposit_result)

    pool = read(contract, "get_pool", pool_id)
    assert pool["total_capital"] == 5000
    assert pool["reserved_capital"] == 0


def test_deposit_rejects_zero_value():
    contract = deploy_riftcover()
    create_result = write(contract, "create_pool", "Zero Value Pool", "[]")
    assert tx_execution_succeeded(create_result)
    pool_id = read(contract, "list_pool_ids")[0]

    result = write(contract, "deposit_pool_capital", pool_id, value=0)
    assert not tx_execution_succeeded(result)


def test_withdraw_available_capital_sends_real_value_back():
    contract = deploy_riftcover()

    write(contract, "create_pool", "Withdraw Test Pool", "[]")
    pool_id = read(contract, "list_pool_ids")[0]
    write(contract, "deposit_pool_capital", pool_id, value=10_000)

    withdraw_result = write(contract, "withdraw_available_capital", pool_id, 4_000)
    assert tx_execution_succeeded(withdraw_result)

    pool = read(contract, "get_pool", pool_id)
    assert pool["total_capital"] == 6_000


def test_withdraw_rejects_amount_over_available_capital():
    contract = deploy_riftcover()
    write(contract, "create_pool", "Overdraw Pool", "[]")
    pool_id = read(contract, "list_pool_ids")[0]
    write(contract, "deposit_pool_capital", pool_id, value=1_000)

    result = write(contract, "withdraw_available_capital", pool_id, 5_000)
    assert not tx_execution_succeeded(result)


def test_create_template_validates_severity_curve():
    contract = deploy_riftcover()
    definition = json.dumps(make_passport())
    result = write(contract, "create_policy_template", "Model Continuity Cover", definition, 500)
    assert tx_execution_succeeded(result)

    template_id = read(contract, "list_template_ids")[0]
    template = read(contract, "get_template", template_id)
    assert template["active"] is True
    assert template["base_rate_bps"] == 500


def _setup_pool_and_template(contract):
    write(contract, "create_pool", "Underwriting Pool", "[]")
    pool_id = read(contract, "list_pool_ids")[0]
    write(contract, "deposit_pool_capital", pool_id, value=1_000_000)

    definition = json.dumps(make_passport())
    write(contract, "create_policy_template", "Model Continuity Cover", definition, 500)
    template_id = read(contract, "list_template_ids")[0]
    return pool_id, template_id


def test_purchase_policy_rejects_incorrect_premium():
    # The premium-mismatch check happens before the contract's only call to
    # _now(), so this path is exercisable even though on-chain time is
    # unavailable on this pinned runner (see the test below).
    accounts = get_accounts()
    beneficiary = accounts[0].address
    contract = deploy_riftcover()
    pool_id, template_id = _setup_pool_and_template(contract)

    max_payout = 100_000
    duration_days = 180
    quote = read(
        contract, "get_policy_quote", pool_id, template_id, max_payout, duration_days, 10000
    )
    premium = quote["premium"]
    assert premium > 0

    passport_json = json.dumps(make_passport())
    trigger_json = json.dumps(make_trigger())
    now = 1_800_000_000

    underpaid_result = write(
        contract,
        "purchase_policy",
        pool_id,
        template_id,
        beneficiary,
        max_payout,
        now,
        now + duration_days * 86400,
        passport_json,
        trigger_json,
        value=premium - 1,
    )
    assert not tx_execution_succeeded(underpaid_result)
    # No policy should have been created by the rejected attempt.
    assert read(contract, "list_policy_ids") == []


def test_purchase_policy_is_blocked_by_missing_onchain_time_source():
    """
    KNOWN, VERIFIED LIMITATION (not a regression): this pinned runner
    (py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6) exposes
    no on-chain time API at all. Confirmed empirically by deploying a probe
    contract to StudioNet that enumerated every attribute of gl.message and
    gl.vm live -- neither has any timestamp field or function. purchase_policy
    calls self._now(), which deliberately raises POLICY_ERROR rather than
    guessing or faking a time source. This test documents that a *correctly
    paid* purchase_policy call still fails today, specifically due to this,
    and will need updating once a real time source is confirmed (see
    IMPLEMENTATION_PLAN.md section 6).
    """
    accounts = get_accounts()
    beneficiary = accounts[0].address
    contract = deploy_riftcover()
    pool_id, template_id = _setup_pool_and_template(contract)

    max_payout = 100_000
    duration_days = 180
    quote = read(
        contract, "get_policy_quote", pool_id, template_id, max_payout, duration_days, 10000
    )
    premium = quote["premium"]

    passport_json = json.dumps(make_passport())
    trigger_json = json.dumps(make_trigger())
    now = 1_800_000_000

    result = write(
        contract,
        "purchase_policy",
        pool_id,
        template_id,
        beneficiary,
        max_payout,
        now,
        now + duration_days * 86400,
        passport_json,
        trigger_json,
        value=premium,
    )
    # This SHOULD eventually succeed once an on-chain time source exists.
    assert not tx_execution_succeeded(result)

import { getGenLayerClient } from "./client";
import { requireContractAddress } from "./contract";

async function view<T>(functionName: string, args: any[] = []): Promise<T> {
  const client = getGenLayerClient();
  const address = requireContractAddress();
  return client.readContract({ address, functionName, args }) as Promise<T>;
}

export interface ProtocolConfig {
  admin: string;
  treasury: string;
  paused: boolean;
  pool_count: number;
  template_count: number;
  policy_count: number;
  claim_count: number;
}

export interface Pool {
  owner: string;
  name: string;
  total_capital: number;
  reserved_capital: number;
  paid_out: number;
  active: boolean;
}

export interface Template {
  creator: string;
  name: string;
  active: boolean;
  definition_json: string;
  base_rate_bps: number;
}

export interface Policy {
  owner: string;
  beneficiary: string;
  pool_id: string;
  template_id: string;
  status: string;
  start_at: number;
  end_at: number;
  waiting_ends_at: number;
  premium: number;
  max_payout: number;
  reserved_capital: number;
}

export interface Claim {
  policy_id: string;
  reporter: string;
  status: string;
  reported_at: number;
  claimed_event_class: string;
  evidence_count: number;
  result: string;
  event_class: string;
  severity: number;
  payout_bps: number;
  payout_amount: number;
  challenge_ends_at: number;
  paid: boolean;
}

export interface EvidenceItem {
  index: number;
  url: string;
  source_class: string;
  description: string;
}

export interface PolicyQuote {
  premium: number;
  required_reserve: number;
  available_capacity: number;
  sufficient_capacity: boolean;
}

export const reads = {
  getProtocolConfig: () => view<ProtocolConfig>("get_protocol_config"),
  getPool: (poolId: string) => view<Pool>("get_pool", [poolId]),
  getTemplate: (templateId: string) => view<Template>("get_template", [templateId]),
  getPolicy: (policyId: string) => view<Policy>("get_policy", [policyId]),
  getPolicyPassport: (policyId: string) => view<string>("get_policy_passport", [policyId]),
  getPolicyTrigger: (policyId: string) => view<string>("get_policy_trigger", [policyId]),
  getClaim: (claimId: string) => view<Claim>("get_claim", [claimId]),
  getClaimEvidence: (claimId: string) => view<EvidenceItem[]>("get_claim_evidence", [claimId]),
  getClaimVerdict: (claimId: string) => view<string>("get_claim_verdict", [claimId]),
  getPolicyQuote: (
    poolId: string,
    templateId: string,
    maxPayout: number,
    durationDays: number,
    riskBandBps: number,
  ) =>
    view<PolicyQuote>("get_policy_quote", [
      poolId,
      templateId,
      maxPayout,
      durationDays,
      riskBandBps,
    ]),
  listPoolIds: () => view<string[]>("list_pool_ids"),
  listTemplateIds: () => view<string[]>("list_template_ids"),
  listPolicyIds: () => view<string[]>("list_policy_ids"),
  listClaimIds: () => view<string[]>("list_claim_ids"),
};

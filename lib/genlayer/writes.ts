import { getGenLayerClient } from "./client";
import { requireContractAddress } from "./contract";

async function write(
  functionName: string,
  args: any[] = [],
  value: bigint = 0n,
): Promise<`0x${string}`> {
  const client = getGenLayerClient();
  const address = requireContractAddress();
  return client.writeContract({ address, functionName, args, value: value as any });
}

export const writes = {
  setProtocolPaused: (paused: boolean) => write("set_protocol_paused", [paused]),
  setAdmin: (newAdmin: string) => write("set_admin", [newAdmin]),
  setTreasury: (newTreasury: string) => write("set_treasury", [newTreasury]),

  createPolicyTemplate: (name: string, definitionJson: string, baseRateBps: number) =>
    write("create_policy_template", [name, definitionJson, baseRateBps]),
  deactivatePolicyTemplate: (templateId: string) =>
    write("deactivate_policy_template", [templateId]),

  createPool: (name: string, supportedTemplatesJson: string) =>
    write("create_pool", [name, supportedTemplatesJson]),
  /** `amount` is real GEN (in wei, the chain's smallest unit) attached as transaction value. */
  depositPoolCapital: (poolId: string, amount: number | bigint) =>
    write("deposit_pool_capital", [poolId], BigInt(amount)),
  withdrawAvailableCapital: (poolId: string, amount: number) =>
    write("withdraw_available_capital", [poolId, amount]),
  setPoolActive: (poolId: string, active: boolean) =>
    write("set_pool_active", [poolId, active]),

  /** `premium` must exactly match get_policy_quote's premium and is attached as real GEN transaction value (wei). */
  purchasePolicy: (
    poolId: string,
    templateId: string,
    beneficiary: string,
    maxPayout: number,
    startAt: number,
    endAt: number,
    passportJson: string,
    triggerJson: string,
    premium: number | bigint,
  ) =>
    write(
      "purchase_policy",
      [poolId, templateId, beneficiary, maxPayout, startAt, endAt, passportJson, triggerJson],
      BigInt(premium),
    ),
  activatePolicy: (policyId: string) => write("activate_policy", [policyId]),
  cancelWaitingPolicy: (policyId: string) => write("cancel_waiting_policy", [policyId]),
  expirePolicy: (policyId: string) => write("expire_policy", [policyId]),

  submitEvent: (
    policyId: string,
    claimedEventClass: string,
    eventDateText: string,
    initialEvidenceUrl: string,
    description: string,
  ) =>
    write("submit_event", [
      policyId,
      claimedEventClass,
      eventDateText,
      initialEvidenceUrl,
      description,
    ]),
  addEventEvidence: (
    claimId: string,
    url: string,
    sourceClass: string,
    description: string,
  ) => write("add_event_evidence", [claimId, url, sourceClass, description]),
  closeEvidenceWindow: (claimId: string) => write("close_evidence_window", [claimId]),
  resolveEvent: (claimId: string) => write("resolve_event", [claimId]),
  challengeDecision: (
    claimId: string,
    evidenceUrl: string,
    sourceClass: string,
    description: string,
  ) => write("challenge_decision", [claimId, evidenceUrl, sourceClass, description]),
  finalizeClaim: (claimId: string) => write("finalize_claim", [claimId]),
  executePayout: (claimId: string) => write("execute_payout", [claimId]),
};

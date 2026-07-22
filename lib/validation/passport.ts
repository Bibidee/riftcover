import { DependencyPassport } from "@/lib/domain/dependency";
import { EVENT_CLASSES, MAX_DOMAINS } from "@/lib/constants/enums";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Client-side mirror of contracts/riftcover.py::_validate_passport, for fast
 * UX feedback in the Policy Builder. This is NOT a trust boundary — the
 * contract re-validates everything on-chain regardless of what the UI allows.
 */
export function validatePassportDraft(passport: Partial<DependencyPassport>): ValidationResult {
  const errors: string[] = [];

  if (passport.version !== 1) errors.push("version must be 1");
  if (!passport.protected_capability) errors.push("protected_capability is required");
  if (!passport.registered_workflow) errors.push("registered_workflow is required");

  const domains = passport.official_domains ?? [];
  if (domains.length === 0) errors.push("at least one official domain is required");
  if (domains.length > MAX_DOMAINS) errors.push(`no more than ${MAX_DOMAINS} domains allowed`);
  const normalized = domains.map((d) => d.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) errors.push("duplicate domains are not allowed");

  const covered = passport.covered_events ?? [];
  if (covered.length === 0) errors.push("at least one covered event is required");
  for (const ec of covered) {
    if (!(EVENT_CLASSES as readonly string[]).includes(ec)) {
      errors.push(`unsupported event class: ${ec}`);
    }
  }

  const rules = passport.severity_rules ?? [];
  if (rules.length === 0) errors.push("at least one severity rule is required");
  let lastBps = -1;
  for (const rule of rules) {
    if (rule.payout_bps < 0 || rule.payout_bps > 10000) {
      errors.push(`payout_bps out of range for severity ${rule.severity}`);
    }
    if (rule.payout_bps < lastBps) errors.push("payout curve must not decrease with severity");
    lastBps = rule.payout_bps;
  }

  return { valid: errors.length === 0, errors };
}

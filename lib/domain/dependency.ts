import { EventClass } from "@/lib/constants/enums";

export interface SeverityRule {
  severity: number;
  definition: string;
  payout_bps: number;
}

export interface DependencyPassport {
  version: 1;
  dependency_id: string;
  provider_name: string;
  dependency_name: string;
  protected_capability: string;
  registered_workflow: string;
  official_domains: string[];
  covered_events: EventClass[];
  exclusions: string[];
  required_notice_days: number;
  severity_rules: SeverityRule[];
}

export function canonicalizePassport(passport: DependencyPassport): DependencyPassport {
  return {
    ...passport,
    official_domains: [...new Set(passport.official_domains.map((d) => d.trim().toLowerCase()))].sort(),
    covered_events: [...passport.covered_events].sort(),
    exclusions: [...passport.exclusions].sort(),
    severity_rules: [...passport.severity_rules].sort((a, b) => a.severity - b.severity),
  };
}

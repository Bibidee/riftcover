export interface AdjudicationVerdict {
  schema_version: 1;
  qualifies: boolean;
  result: "QUALIFIED" | "NOT_QUALIFIED" | "INCONCLUSIVE";
  event_class: string;
  severity: number;
  notice_days: number;
  protected_dependency_matched: boolean;
  primary_evidence_present: boolean;
  exclusion_applies: boolean;
  confidence_band: "HIGH" | "MEDIUM" | "LOW";
  reason_code: string;
}

export function parseVerdict(verdictJson: string): AdjudicationVerdict | null {
  if (!verdictJson) return null;
  try {
    return JSON.parse(verdictJson) as AdjudicationVerdict;
  } catch {
    return null;
  }
}

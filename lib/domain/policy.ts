import { SourceClass } from "@/lib/constants/enums";

export interface PolicyTrigger {
  approved_source_hierarchy: SourceClass[];
  risk_band_bps?: number;
}

export const RISK_BANDS: Record<string, number> = {
  LOW: 5000,
  MEDIUM: 10000,
  HIGH: 15000,
  EXTREME: 25000,
};

export function severityToPayoutPercent(severityBps: number): string {
  return `${(severityBps / 100).toFixed(0)}%`;
}

import { ClippedPanel } from "@/components/shared/ClippedPanel";
import { MeasurementLabel } from "@/components/shared/MeasurementLabel";
import { StatusStamp } from "@/components/shared/StatusStamp";
import { formatMinorUnits, formatTimestamp } from "@/lib/formatting/money";
import { Policy } from "@/lib/genlayer/reads";

/** Policy rendered as a printable technical certificate. */
export function PolicyInstrument({ policyId, policy }: { policyId: string; policy: Policy }) {
  return (
    <ClippedPanel clipCorner className="p-6 print:border-black">
      <div className="flex items-center justify-between border-b-2 border-carbon pb-3">
        <span className="font-data text-xs uppercase tracking-wide2 text-fog">
          Policy Specimen <span className="font-medium text-carbon">{policyId}</span>
        </span>
        <StatusStamp status={policy.status} />
      </div>
      <div className="mt-2">
        <MeasurementLabel label="Owner" value={policy.owner} />
        <MeasurementLabel label="Beneficiary" value={policy.beneficiary} />
        <MeasurementLabel label="Pool" value={policy.pool_id} />
        <MeasurementLabel label="Template" value={policy.template_id} />
        <MeasurementLabel label="Coverage" value={formatMinorUnits(policy.max_payout)} />
        <MeasurementLabel label="Premium" value={formatMinorUnits(policy.premium)} />
        <MeasurementLabel label="Reserved capital" value={formatMinorUnits(policy.reserved_capital)} />
        <MeasurementLabel label="Activation" value={formatTimestamp(policy.start_at)} />
        <MeasurementLabel label="Expiry" value={formatTimestamp(policy.end_at)} />
      </div>
    </ClippedPanel>
  );
}

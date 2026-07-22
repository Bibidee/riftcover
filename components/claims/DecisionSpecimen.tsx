import { AdjudicationVerdict } from "@/lib/domain/claim";
import { ClippedPanel } from "@/components/shared/ClippedPanel";
import { MeasurementLabel } from "@/components/shared/MeasurementLabel";
import { StatusStamp } from "@/components/shared/StatusStamp";
import { bpsToPercent } from "@/lib/formatting/money";

export function DecisionSpecimen({
  verdict,
  claimStatus,
  payoutBps,
  claimId,
}: {
  verdict: AdjudicationVerdict | null;
  claimStatus: string;
  payoutBps: number;
  claimId: string;
}) {
  const accent =
    verdict?.result === "QUALIFIED"
      ? "text-vermilion"
      : verdict?.result === "NOT_QUALIFIED"
        ? "text-fog"
        : "text-cobalt";

  return (
    <ClippedPanel clipCorner interactive className="p-5">
      <div className="flex items-center justify-between">
        <span className="font-data text-xs uppercase tracking-wide2 text-fog">
          Decision Specimen {claimId}
        </span>
        <StatusStamp status={claimStatus} />
      </div>

      {verdict ? (
        <>
          <h2 className="mt-2 font-display text-xl uppercase leading-tight text-carbon">
            {verdict.result === "QUALIFIED" ? "Qualifying Event" : verdict.result.replace(/_/g, " ")}
          </h2>
          <p className={`font-data text-sm font-medium uppercase tracking-wider ${accent}`}>
            {verdict.event_class.replace(/_/g, " ")}
          </p>
          <div className="mt-3">
            <MeasurementLabel label="Severity" value={String(verdict.severity)} />
            <MeasurementLabel label="Payout" value={bpsToPercent(payoutBps)} />
            <MeasurementLabel label="Confidence" value={verdict.confidence_band} />
            <MeasurementLabel label="Reason code" value={verdict.reason_code} />
            <MeasurementLabel label="Notice days" value={String(verdict.notice_days)} />
          </div>
        </>
      ) : (
        <p className="mt-2 font-data text-sm italic text-fog">No verdict recorded yet.</p>
      )}
    </ClippedPanel>
  );
}

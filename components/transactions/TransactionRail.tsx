import { TxLifecycleStatus } from "@/lib/genlayer/receipts";

const STAGES: TxLifecycleStatus[] = ["REVIEW", "SIGNING", "SUBMITTED", "PENDING", "FINALIZED"];

/**
 * Horizontal transaction lifecycle indicator. Required by the product spec:
 * never show instant success right after a write submission — this rail
 * makes SUBMITTED/PENDING states visible before FINALIZED.
 */
export function TransactionRail({
  status,
  failedReason,
}: {
  status: TxLifecycleStatus;
  failedReason?: string;
}) {
  if (status === "FAILED") {
    return (
      <div className="flex items-center gap-2 border-2 border-vermilion bg-paper px-3 py-2">
        <span className="h-2 w-2 shrink-0 bg-vermilion" />
        <span className="font-data text-xs font-medium uppercase tracking-wider text-vermilion">
          Failed
        </span>
        {failedReason && <p className="font-data text-xs text-carbon">{failedReason}</p>}
      </div>
    );
  }

  const activeIndex = STAGES.indexOf(status);
  const isFinalized = status === "FINALIZED";

  return (
    <div className="flex items-center gap-3" role="status" aria-label={`Transaction status: ${status}`}>
      <div className="flex flex-1 items-center gap-0.5">
        {STAGES.map((stage, i) => (
          <div
            key={stage}
            className={`h-1.5 flex-1 transition-colors duration-300 ${
              i <= activeIndex ? (isFinalized ? "bg-lime" : "bg-cobalt") : "bg-fog-soft"
            }`}
          />
        ))}
      </div>
      <span className="shrink-0 font-data text-xs font-medium uppercase tracking-wider text-carbon">
        {status}
      </span>
    </div>
  );
}

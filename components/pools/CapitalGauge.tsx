import { formatWeiToGen } from "@/lib/formatting/money";

export function CapitalGauge({
  totalCapital,
  reservedCapital,
}: {
  /** Wei-denominated GEN, as decimal strings from a contract read. */
  totalCapital: string;
  reservedCapital: string;
}) {
  const total = BigInt(totalCapital);
  const reserved = BigInt(reservedCapital);
  const pct = total === 0n ? 0 : Number((reserved * 100n) / total > 100n ? 100n : (reserved * 100n) / total);
  return (
    <div>
      <div className="flex justify-between font-data text-xs uppercase tracking-wide2 text-fog">
        <span className="font-medium text-carbon">Reserved {pct}%</span>
        <span className="font-tabular">
          {formatWeiToGen(reservedCapital)} / {formatWeiToGen(totalCapital)} GEN
        </span>
      </div>
      <div className="mt-1.5 h-2.5 border border-carbon bg-fog-soft/40">
        <div
          className={`h-full transition-[width] duration-500 ease-signal ${pct >= 90 ? "bg-vermilion" : "bg-cobalt"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

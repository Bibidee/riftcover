import { formatMinorUnits } from "@/lib/formatting/money";

export function CapitalGauge({
  totalCapital,
  reservedCapital,
}: {
  totalCapital: number;
  reservedCapital: number;
}) {
  const pct = totalCapital === 0 ? 0 : Math.min(100, Math.round((reservedCapital / totalCapital) * 100));
  return (
    <div>
      <div className="flex justify-between font-data text-xs uppercase tracking-wide2 text-fog">
        <span className="font-medium text-carbon">Reserved {pct}%</span>
        <span className="font-tabular">
          {formatMinorUnits(reservedCapital)} / {formatMinorUnits(totalCapital)}
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

"use client";

import { useEffect, useState } from "react";
import { reads } from "@/lib/genlayer/reads";
import { TopologyTree, TopologyGroup } from "@/components/pools/TopologyTree";
import { formatMinorUnits } from "@/lib/formatting/money";

export default function UnderwritePage() {
  const [totals, setTotals] = useState<{ total: number; reserved: number; paid: number } | null>(null);
  const [groups, setGroups] = useState<TopologyGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const poolIds = await reads.listPoolIds();
        const pools = await Promise.all(poolIds.map((id) => reads.getPool(id)));
        const total = pools.reduce((s, p) => s + p.total_capital, 0);
        const reserved = pools.reduce((s, p) => s + p.reserved_capital, 0);
        const paid = pools.reduce((s, p) => s + p.paid_out, 0);
        setTotals({ total, reserved, paid });
        setGroups([
          {
            category: "POOLS",
            entries: pools.map((p, i) => ({ name: p.name || poolIds[i], reserved: p.reserved_capital })),
          },
        ]);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase text-carbon">Underwriter Console</h1>
      {error && (
        <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}
      {totals && (
        <div className="grid grid-cols-1 gap-4 font-data text-sm md:grid-cols-3">
          <div className="border border-carbon p-3">
            <p className="text-xs uppercase text-fog">Total capital</p>
            <p className="font-tabular text-lg text-carbon">{formatMinorUnits(totals.total)}</p>
          </div>
          <div className="border border-carbon p-3">
            <p className="text-xs uppercase text-fog">Reserved capital</p>
            <p className="font-tabular text-lg text-carbon">{formatMinorUnits(totals.reserved)}</p>
          </div>
          <div className="border border-carbon p-3">
            <p className="text-xs uppercase text-fog">Paid claims</p>
            <p className="font-tabular text-lg text-carbon">{formatMinorUnits(totals.paid)}</p>
          </div>
        </div>
      )}
      <TopologyTree groups={groups} />
    </div>
  );
}

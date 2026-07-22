"use client";

import { useEffect, useState } from "react";
import { reads } from "@/lib/genlayer/reads";
import { SignalStrip, SignalStripData } from "@/components/laboratory/SignalStrip";

export default function ObservatoryPage() {
  const [signals, setSignals] = useState<SignalStripData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const policyIds = await reads.listPolicyIds();
        const rows = await Promise.all(
          policyIds.map(async (id) => {
            const policy = await reads.getPolicy(id);
            let name = id;
            try {
              const passport = JSON.parse(await reads.getPolicyPassport(id));
              name = passport.dependency_name ?? id;
            } catch {
              /* fall back to policy id */
            }
            return {
              id,
              name,
              coverage: policy.max_payout,
              policies: 1,
              state: policy.status,
              lastChecked: "—",
            } satisfies SignalStripData;
          }),
        );
        setSignals(rows);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-carbon">Observatory</h1>
      <p className="mt-1 font-data text-xs uppercase tracking-wider text-fog">
        Live dependency signals, read directly from the deployed contract.
      </p>

      {error && (
        <p className="mt-4 border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">
          EXTERNAL: could not read from contract — {error}
        </p>
      )}

      <div className="mt-6 border border-carbon">
        {signals === null && !error && (
          <p className="p-4 font-data text-xs text-fog">Loading…</p>
        )}
        {signals?.length === 0 && (
          <p className="p-4 font-data text-xs text-fog">No policies registered yet.</p>
        )}
        {signals?.map((s) => (
          <SignalStrip key={s.id} data={s} href={`/policies/${s.id}`} />
        ))}
      </div>
    </div>
  );
}

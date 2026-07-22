"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reads } from "@/lib/genlayer/reads";
import { StatusStamp } from "@/components/shared/StatusStamp";

export default function ClaimsPage() {
  const [rows, setRows] = useState<{ id: string; status: string; policyId: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ids = await reads.listClaimIds();
        const withStatus = await Promise.all(
          ids.map(async (id) => {
            const claim = await reads.getClaim(id);
            return { id, status: claim.status, policyId: claim.policy_id };
          }),
        );
        setRows(withStatus);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-carbon">Claims</h1>
      {error && (
        <p className="mt-4 border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}
      <div className="mt-6 border border-carbon">
        {rows === null && !error && <p className="p-4 font-data text-xs text-fog">Loading…</p>}
        {rows?.length === 0 && <p className="p-4 font-data text-xs text-fog">No claims yet.</p>}
        {rows?.map((r) => (
          <Link
            key={r.id}
            href={`/claims/${r.id}`}
            className="flex items-center justify-between border-b border-carbon px-4 py-3 last:border-b-0 hover:bg-lime/20"
          >
            <span className="font-data text-sm text-carbon">
              {r.id} <span className="text-fog">on {r.policyId}</span>
            </span>
            <StatusStamp status={r.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

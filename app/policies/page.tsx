"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reads } from "@/lib/genlayer/reads";
import { StatusStamp } from "@/components/shared/StatusStamp";

export default function PoliciesPage() {
  const [rows, setRows] = useState<{ id: string; status: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ids = await reads.listPolicyIds();
        const withStatus = await Promise.all(
          ids.map(async (id) => ({ id, status: (await reads.getPolicy(id)).status })),
        );
        setRows(withStatus);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase text-carbon">Policies</h1>
        <Link
          href="/policies/new"
          className="btn-primary !px-3 !py-1.5"
        >
          New Policy
        </Link>
      </div>

      {error && (
        <p className="mt-4 border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}

      <div className="mt-6 border border-carbon">
        {rows === null && !error && <p className="p-4 font-data text-xs text-fog">Loading…</p>}
        {rows?.length === 0 && <p className="p-4 font-data text-xs text-fog">No policies yet.</p>}
        {rows?.map((r) => (
          <Link
            key={r.id}
            href={`/policies/${r.id}`}
            className="flex items-center justify-between border-b border-carbon px-4 py-3 last:border-b-0 hover:bg-lime/20"
          >
            <span className="font-data text-sm text-carbon">{r.id}</span>
            <StatusStamp status={r.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

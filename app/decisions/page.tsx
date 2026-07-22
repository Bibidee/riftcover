"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reads } from "@/lib/genlayer/reads";
import { parseVerdict } from "@/lib/domain/claim";

export default function DecisionsPage() {
  const [rows, setRows] = useState<{ id: string; result: string; eventClass: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ids = await reads.listClaimIds();
        const decided: { id: string; result: string; eventClass: string }[] = [];
        for (const id of ids) {
          const verdictJson = await reads.getClaimVerdict(id);
          const verdict = parseVerdict(verdictJson);
          if (verdict) {
            decided.push({ id, result: verdict.result, eventClass: verdict.event_class });
          }
        }
        setRows(decided);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-carbon">Decision Archive</h1>
      <p className="mt-1 font-data text-xs uppercase tracking-wider text-fog">
        Public, searchable record of every GenLayer adjudication.
      </p>
      {error && (
        <p className="mt-4 border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}
      <div className="mt-6 border border-carbon">
        {rows === null && !error && <p className="p-4 font-data text-xs text-fog">Loading…</p>}
        {rows?.length === 0 && <p className="p-4 font-data text-xs text-fog">No decisions yet.</p>}
        {rows?.map((r) => (
          <Link
            key={r.id}
            href={`/decisions/${r.id}`}
            className="flex items-center justify-between border-b border-carbon px-4 py-3 last:border-b-0 hover:bg-lime/20"
          >
            <span className="font-data text-sm text-carbon">{r.id}</span>
            <span className="font-data text-xs uppercase text-fog">
              {r.eventClass.replace(/_/g, " ")} — {r.result}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

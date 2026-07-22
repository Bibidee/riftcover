"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reads, Pool } from "@/lib/genlayer/reads";
import { writes } from "@/lib/genlayer/writes";
import { waitForFinalized } from "@/lib/genlayer/receipts";
import { CapitalGauge } from "@/components/pools/CapitalGauge";

export default function PoolsPage() {
  const [rows, setRows] = useState<{ id: string; pool: Pool }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const ids = await reads.listPoolIds();
      const withPool = await Promise.all(ids.map(async (id) => ({ id, pool: await reads.getPool(id) })));
      setRows(withPool);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const hash = await writes.createPool(name, "[]");
      await waitForFinalized(hash);
      setName("");
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-carbon">Underwriting Pools</h1>

      <section className="mt-4 flex gap-2">
        <input
          className="field flex-1"
          placeholder="Pool name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={busy || !name}
          onClick={handleCreate}
          className="btn-primary !px-3 !py-1.5"
        >
          Create Pool
        </button>
      </section>

      {error && (
        <p className="mt-4 border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}

      <div className="mt-6 space-y-4">
        {rows?.map((r) => (
          <Link key={r.id} href={`/pools/${r.id}`} className="block border border-carbon p-4 hover:bg-lime/10">
            <div className="flex items-center justify-between">
              <span className="font-data text-sm uppercase text-carbon">{r.pool.name}</span>
              <span className="font-data text-xs text-fog">{r.id}</span>
            </div>
            <div className="mt-2">
              <CapitalGauge totalCapital={r.pool.total_capital} reservedCapital={r.pool.reserved_capital} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

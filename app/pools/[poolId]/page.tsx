"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { reads, Pool } from "@/lib/genlayer/reads";
import { writes } from "@/lib/genlayer/writes";
import { waitForFinalized } from "@/lib/genlayer/receipts";
import { CapitalGauge } from "@/components/pools/CapitalGauge";
import { MeasurementLabel } from "@/components/shared/MeasurementLabel";
import { formatWeiToGen, parseGenToWei } from "@/lib/formatting/money";

export default function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("1000");

  async function refresh() {
    try {
      setPool(await reads.getPool(poolId));
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]);

  async function handleDeposit() {
    setBusy(true);
    setError(null);
    try {
      const amountWei = parseGenToWei(amount);
      if (amountWei <= 0n) throw new Error("Deposit amount must be greater than zero");
      const hash = await writes.depositPoolCapital(poolId, amountWei);
      await waitForFinalized(hash);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    setBusy(true);
    setError(null);
    try {
      const amountWei = parseGenToWei(withdrawAmount);
      if (amountWei <= 0n) throw new Error("Withdraw amount must be greater than zero");
      const hash = await writes.withdrawAvailableCapital(poolId, amountWei);
      await waitForFinalized(hash);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!pool) {
    return error ? (
      <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
    ) : (
      <p className="font-data text-xs text-fog">Loading…</p>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl uppercase text-carbon">{pool.name}</h1>
      <CapitalGauge totalCapital={pool.total_capital} reservedCapital={pool.reserved_capital} />
      <div className="space-y-1">
        <MeasurementLabel label="Owner" value={pool.owner} />
        <MeasurementLabel label="Paid out" value={`${formatWeiToGen(pool.paid_out)} GEN`} />
        <MeasurementLabel label="Active" value={String(pool.active)} />
      </div>

      {error && (
        <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">Deposit Capital (real payable GEN)</h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="1.25"
            className="field flex-1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={handleDeposit}
            className="btn-primary !px-3 !py-1.5"
          >
            Deposit
          </button>
        </div>
      </section>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">
          Withdraw Available Capital (real GEN transfer)
        </h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="1.25"
            className="field flex-1"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={handleWithdraw}
            className="btn-secondary !px-3 !py-1.5"
          >
            Withdraw
          </button>
        </div>
      </section>
    </div>
  );
}

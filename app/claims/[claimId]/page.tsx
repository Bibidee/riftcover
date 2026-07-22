"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { reads, Claim, EvidenceItem } from "@/lib/genlayer/reads";
import { writes } from "@/lib/genlayer/writes";
import { waitForFinalized } from "@/lib/genlayer/receipts";
import { parseVerdict } from "@/lib/domain/claim";
import { EvidenceLane } from "@/components/claims/EvidenceLane";
import { DecisionSpecimen } from "@/components/claims/DecisionSpecimen";
import { validateEvidenceUrl } from "@/lib/validation/evidence";
import { formatCountdown } from "@/lib/formatting/money";

/** The Rift Investigation — three lanes: Baseline, Current Signal, Adjudicated Delta. */
export default function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [verdictJson, setVerdictJson] = useState<string>("");
  const [passport, setPassport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [newUrl, setNewUrl] = useState("");
  const [newSourceClass, setNewSourceClass] = useState("OFFICIAL_DOCUMENTATION");
  const [newDescription, setNewDescription] = useState("");

  async function refresh() {
    try {
      const c = await reads.getClaim(claimId);
      setClaim(c);
      setEvidence(await reads.getClaimEvidence(claimId));
      setVerdictJson(await reads.getClaimVerdict(claimId));
      try {
        setPassport(JSON.parse(await reads.getPolicyPassport(c.policy_id)));
      } catch {
        setPassport(null);
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  async function runAction(fn: () => Promise<`0x${string}`>) {
    setBusy(true);
    setError(null);
    try {
      const hash = await fn();
      await waitForFinalized(hash);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddEvidence() {
    const urlError = validateEvidenceUrl(newUrl);
    if (urlError) {
      setError(urlError);
      return;
    }
    await runAction(() => writes.addEventEvidence(claimId, newUrl, newSourceClass, newDescription));
  }

  if (!claim) {
    return error ? (
      <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
    ) : (
      <p className="font-data text-xs text-fog">Loading…</p>
    );
  }

  const verdict = parseVerdict(verdictJson);
  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase text-carbon">Rift Investigation — {claimId}</h1>
      {error && (
        <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-carbon p-4">
          <h2 className="font-data text-xs uppercase tracking-wider text-fog">Baseline</h2>
          {passport ? (
            <div className="mt-2 space-y-1 font-data text-xs text-carbon">
              <p>Capability: {passport.protected_capability}</p>
              <p>Required notice: {passport.required_notice_days} days</p>
              <p>Covered events: {(passport.covered_events ?? []).join(", ")}</p>
              <p>Exclusions: {(passport.exclusions ?? []).join(", ")}</p>
            </div>
          ) : (
            <p className="mt-2 font-data text-xs text-fog">No passport loaded.</p>
          )}
        </div>

        <EvidenceLane title="Current Signal" items={evidence} />

        <DecisionSpecimen
          verdict={verdict}
          claimStatus={claim.status}
          payoutBps={claim.payout_bps}
          claimId={claimId}
        />
      </div>

      {claim.status === "PROPOSED_APPROVED" ||
      claim.status === "PROPOSED_REJECTED" ||
      claim.status === "PROPOSED_INCONCLUSIVE" ? (
        <p className="font-data text-xs uppercase tracking-wider text-vermilion">
          Challenge window: {formatCountdown(claim.challenge_ends_at, now)}
        </p>
      ) : null}

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">Add Evidence</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            className="field"
            placeholder="Evidence URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <input
            className="field"
            placeholder="Source class"
            value={newSourceClass}
            onChange={(e) => setNewSourceClass(e.target.value)}
          />
          <textarea
            className="field md:col-span-2"
            placeholder="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <button
          disabled={busy}
          onClick={handleAddEvidence}
          className="mt-2 btn-secondary !px-3 !py-1.5"
        >
          Add Evidence
        </button>
      </section>

      <div className="flex flex-wrap gap-3">
        {claim.status === "EVIDENCE_OPEN" && (
          <button
            disabled={busy}
            onClick={() => runAction(() => writes.closeEvidenceWindow(claimId))}
            className="btn-secondary !px-3 !py-1.5"
          >
            Close Evidence Window
          </button>
        )}
        {claim.status === "READY_FOR_REVIEW" && (
          <button
            disabled={busy}
            onClick={() => runAction(() => writes.resolveEvent(claimId))}
            className="btn-accent !px-3 !py-1.5"
          >
            Resolve Event (Leader/Validator)
          </button>
        )}
        {["PROPOSED_APPROVED", "PROPOSED_REJECTED", "PROPOSED_INCONCLUSIVE"].includes(claim.status) && (
          <button
            disabled={busy}
            onClick={() => runAction(() => writes.finalizeClaim(claimId))}
            className="btn-secondary !px-3 !py-1.5"
          >
            Finalize Claim
          </button>
        )}
        {claim.status === "FINAL_APPROVED" && !claim.paid && (
          <button
            disabled={busy}
            onClick={() => runAction(() => writes.executePayout(claimId))}
            className="btn-positive !px-3 !py-1.5"
          >
            Execute Payout (Real GEN Transfer)
          </button>
        )}
      </div>

      <button
        onClick={() => setShowRaw((v) => !v)}
        className="font-data text-xs uppercase tracking-wider text-cobalt underline"
      >
        {showRaw ? "Hide" : "Show"} raw structured verdict JSON
      </button>
      {showRaw && (
        <pre className="overflow-x-auto border border-carbon bg-paper p-3 font-data text-xs">
          {verdictJson || "No verdict recorded yet."}
        </pre>
      )}
    </div>
  );
}

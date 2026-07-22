"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { reads, Policy } from "@/lib/genlayer/reads";
import { writes } from "@/lib/genlayer/writes";
import { waitForFinalized } from "@/lib/genlayer/receipts";
import { PolicyInstrument } from "@/components/policy/PolicyInstrument";
import { EVENT_CLASSES, EventClass } from "@/lib/constants/enums";
import { validateEvidenceUrl } from "@/lib/validation/evidence";

export default function PolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [eventClass, setEventClass] = useState<EventClass>(EVENT_CLASSES[0]);
  const [eventDateText, setEventDateText] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [description, setDescription] = useState("");

  async function refresh() {
    try {
      setPolicy(await reads.getPolicy(policyId));
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyId]);

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

  async function handleSubmitEvent() {
    const urlError = validateEvidenceUrl(evidenceUrl);
    if (urlError) {
      setError(urlError);
      return;
    }
    await runAction(() =>
      writes.submitEvent(policyId, eventClass, eventDateText, evidenceUrl, description),
    );
  }

  if (!policy) {
    return error ? (
      <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
    ) : (
      <p className="font-data text-xs text-fog">Loading…</p>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PolicyInstrument policyId={policyId} policy={policy} />

      {error && (
        <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {policy.status === "WAITING_PERIOD" && (
          <button
            disabled={busy}
            onClick={() => runAction(() => writes.activatePolicy(policyId))}
            className="btn-secondary !px-3 !py-1.5"
          >
            Activate
          </button>
        )}
        {(policy.status === "ACTIVE" || policy.status === "WAITING_PERIOD") && (
          <button
            disabled={busy}
            onClick={() => runAction(() => writes.expirePolicy(policyId))}
            className="btn-secondary !px-3 !py-1.5"
          >
            Expire
          </button>
        )}
      </div>

      {policy.status === "ACTIVE" && (
        <section className="border border-carbon p-4">
          <h2 className="font-data text-xs uppercase tracking-wider text-fog">Report an Event</h2>
          <div className="mt-2 space-y-2">
            <select
              className="field"
              value={eventClass}
              onChange={(e) => setEventClass(e.target.value as EventClass)}
            >
              {EVENT_CLASSES.map((ec) => (
                <option key={ec} value={ec}>
                  {ec}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder="Event date (free text, e.g. 2026-10-14)"
              value={eventDateText}
              onChange={(e) => setEventDateText(e.target.value)}
            />
            <input
              className="field"
              placeholder="Evidence URL"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
            />
            <textarea
              className="field"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              disabled={busy}
              onClick={handleSubmitEvent}
              className="btn-accent !px-3 !py-1.5"
            >
              Submit Event
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

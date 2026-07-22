"use client";

import { useState } from "react";
import { reads } from "@/lib/genlayer/reads";
import { getGenLayerClient } from "@/lib/genlayer/client";
import { requireContractAddress } from "@/lib/genlayer/contract";

export default function SimulatePage() {
  const [passportJson, setPassportJson] = useState(
    JSON.stringify(
      {
        version: 1,
        dependency_id: "dep_model_x_api",
        provider_name: "Example Provider",
        dependency_name: "Model X API",
        protected_capability: "public commercial text inference",
        registered_workflow: "customer-support response generation",
        official_domains: ["provider.example"],
        covered_events: ["SERVICE_WITHDRAWAL", "MIGRATION_NOTICE_BREACH"],
        exclusions: ["TEMPORARY_MAINTENANCE_ONLY"],
        required_notice_days: 90,
        severity_rules: [
          { severity: 1, definition: "material degradation", payout_bps: 2000 },
          { severity: 2, definition: "partial loss", payout_bps: 5000 },
          { severity: 3, definition: "complete loss", payout_bps: 10000 },
        ],
      },
      null,
      2,
    ),
  );
  const [eventDescription, setEventDescription] = useState(
    "Model Atlas API announces that Model Atlas-2 will be retired in 30 days.",
  );
  const [urls, setUrls] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runSimulation() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const client = getGenLayerClient();
      const address = requireContractAddress();
      const urlList = urls.split(",").map((u) => u.trim()).filter(Boolean);
      const res = await client.readContract({
        address,
        functionName: "simulate_policy_against_event",
        args: [passportJson, eventDescription, JSON.stringify(urlList)],
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-carbon">Historical Simulation</h1>
        <p className="mt-1 border-2 border-vermilion px-3 py-1 font-data text-xs uppercase tracking-wider text-vermilion">
          NON-BINDING POLICY DRAFT SIMULATION
        </p>
      </div>

      <label className="block font-data text-xs uppercase tracking-wider text-fog">
        Draft passport JSON
        <textarea
          className="field mt-1 h-48 font-data text-xs"
          value={passportJson}
          onChange={(e) => setPassportJson(e.target.value)}
        />
      </label>

      <label className="block font-data text-xs uppercase tracking-wider text-fog">
        Historical event description
        <textarea
          className="field mt-1"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
        />
      </label>

      <label className="block font-data text-xs uppercase tracking-wider text-fog">
        Evidence URLs (comma-separated)
        <input
          className="field mt-1"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
        />
      </label>

      <button
        disabled={busy}
        onClick={runSimulation}
        className="btn-primary"
      >
        Run Simulation
      </button>

      {error && (
        <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>
      )}

      {result && (
        <pre className="overflow-x-auto border border-carbon bg-paper p-3 font-data text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

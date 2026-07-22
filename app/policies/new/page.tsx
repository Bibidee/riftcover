"use client";

import { useState } from "react";
import { EVENT_CLASSES, EventClass, SOURCE_CLASSES } from "@/lib/constants/enums";
import { validatePassportDraft } from "@/lib/validation/passport";
import { reads } from "@/lib/genlayer/reads";
import { writes } from "@/lib/genlayer/writes";
import { waitForFinalized, explorerTxUrl } from "@/lib/genlayer/receipts";
import { TransactionRail } from "@/components/transactions/TransactionRail";
import { TxLifecycleStatus } from "@/lib/genlayer/receipts";

export default function PolicyBuilderPage() {
  const [poolId, setPoolId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [dependencyName, setDependencyName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [protectedCapability, setProtectedCapability] = useState("");
  const [registeredWorkflow, setRegisteredWorkflow] = useState("");
  const [domainsText, setDomainsText] = useState("");
  const [coveredEvents, setCoveredEvents] = useState<string[]>(["SERVICE_WITHDRAWAL"]);
  const [exclusions, setExclusions] = useState<string[]>(["TEMPORARY_MAINTENANCE_ONLY"]);
  const [noticeDays, setNoticeDays] = useState(90);
  const [sources, setSources] = useState<string[]>(["OFFICIAL_ANNOUNCEMENT", "OFFICIAL_DOCUMENTATION"]);
  const [maxPayout, setMaxPayout] = useState(10000);
  const [durationDays, setDurationDays] = useState(180);
  const [beneficiary, setBeneficiary] = useState("");

  const [quote, setQuote] = useState<Awaited<ReturnType<typeof reads.getPolicyQuote>> | null>(null);
  const [txStatus, setTxStatus] = useState<TxLifecycleStatus | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [templateName, setTemplateName] = useState("Model Continuity Cover");
  const [templateBaseRateBps, setTemplateBaseRateBps] = useState(500);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);

  function buildPassport() {
    return {
      version: 1 as const,
      dependency_id: dependencyName.toLowerCase().replace(/\s+/g, "_"),
      provider_name: providerName,
      dependency_name: dependencyName,
      protected_capability: protectedCapability,
      registered_workflow: registeredWorkflow,
      official_domains: domainsText.split(",").map((d) => d.trim()).filter(Boolean),
      covered_events: coveredEvents as EventClass[],
      exclusions,
      required_notice_days: noticeDays,
      severity_rules: [
        { severity: 1, definition: "material degradation without complete loss", payout_bps: 2000 },
        { severity: 2, definition: "partial loss of registered capability", payout_bps: 5000 },
        { severity: 3, definition: "complete qualifying loss", payout_bps: 10000 },
      ],
    };
  }

  function buildTrigger() {
    return { approved_source_hierarchy: sources, risk_band_bps: 10000 };
  }

  async function handleCreateTemplate() {
    setTemplateError(null);
    setCreatedTemplateId(null);
    const validation = validatePassportDraft(buildPassport());
    if (!validation.valid) {
      setTemplateError(validation.errors.join("; "));
      return;
    }
    setTemplateBusy(true);
    try {
      const hash = await writes.createPolicyTemplate(
        templateName,
        JSON.stringify(buildPassport()),
        templateBaseRateBps,
      );
      await waitForFinalized(hash);
      const ids = await reads.listTemplateIds();
      const newId = ids[ids.length - 1];
      setCreatedTemplateId(newId ?? null);
      if (newId) setTemplateId(newId);
    } catch (err: any) {
      setTemplateError(err?.message ?? String(err));
    } finally {
      setTemplateBusy(false);
    }
  }

  async function handleQuote() {
    setErrors([]);
    const validation = validatePassportDraft(buildPassport());
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    try {
      const q = await reads.getPolicyQuote(poolId, templateId, maxPayout, durationDays, 10000);
      setQuote(q);
    } catch (err: any) {
      setErrors([err?.message ?? String(err)]);
    }
  }

  async function handlePurchase() {
    if (!quote) return;
    setTxStatus("SIGNING");
    try {
      const now = Math.floor(Date.now() / 1000);
      const hash = await writes.purchasePolicy(
        poolId,
        templateId,
        beneficiary || "",
        maxPayout,
        now,
        now + durationDays * 86400,
        JSON.stringify(buildPassport()),
        JSON.stringify(buildTrigger()),
        quote.premium,
      );
      setTxHash(hash);
      setTxStatus("SUBMITTED");
      setTxStatus("PENDING");
      await waitForFinalized(hash);
      setTxStatus("FINALIZED");
    } catch (err: any) {
      setTxStatus("FAILED");
      setErrors([err?.message ?? String(err)]);
    }
  }

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-display text-2xl uppercase text-carbon">Dependency Passport Builder</h1>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">A. Protected System</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="field"
            placeholder="Dependency name"
            value={dependencyName}
            onChange={(e) => setDependencyName(e.target.value)}
          />
          <input
            className="field"
            placeholder="Provider name"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
          />
          <input
            className="field md:col-span-2"
            placeholder="Protected capability (e.g. public commercial text inference)"
            value={protectedCapability}
            onChange={(e) => setProtectedCapability(e.target.value)}
          />
        </div>
      </section>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">B. Registered Workflow</h2>
        <input
          className="field mt-2"
          placeholder="Registered production workflow"
          value={registeredWorkflow}
          onChange={(e) => setRegisteredWorkflow(e.target.value)}
        />
      </section>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">D. Covered Rifts</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {EVENT_CLASSES.map((ec) => (
            <button
              key={ec}
              type="button"
              onClick={() => toggle(coveredEvents, setCoveredEvents, ec)}
              className={`border px-2 py-1 font-data text-xs uppercase ${
                coveredEvents.includes(ec) ? "border-cobalt bg-cobalt text-paper" : "border-carbon text-carbon"
              }`}
            >
              {ec.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">E. Exclusions</h2>
        <input
          className="field mt-2"
          placeholder="Comma-separated exclusion codes"
          value={exclusions.join(", ")}
          onChange={(e) => setExclusions(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
        <div className="mt-2">
          <label className="font-data text-xs uppercase tracking-wider text-fog">
            Required notice days
          </label>
          <input
            type="number"
            className="field ml-2 !w-24"
            value={noticeDays}
            onChange={(e) => setNoticeDays(Number(e.target.value))}
          />
        </div>
      </section>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">F. Source Hierarchy</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {SOURCE_CLASSES.map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => toggle(sources, setSources, sc)}
              className={`border px-2 py-1 font-data text-xs uppercase ${
                sources.includes(sc) ? "border-cobalt bg-cobalt text-paper" : "border-carbon text-carbon"
              }`}
            >
              {sc.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <input
          className="field mt-2"
          placeholder="Official domains, comma-separated"
          value={domainsText}
          onChange={(e) => setDomainsText(e.target.value)}
        />
      </section>

      <section className="border-2 border-cobalt p-4">
        <h2 className="font-data text-xs uppercase tracking-wide2 text-cobalt">
          Admin: Create Policy Template
        </h2>
        <p className="mt-1 font-data text-xs text-fog">
          Admin-only (enforced by the contract) — creates a template from sections
          A/B/D/E/F above, so fill those in first. Only needed once per template;
          reuse the resulting Template ID for future policies.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="field"
            placeholder="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <input
            type="number"
            className="field"
            placeholder="Base rate (bps)"
            value={templateBaseRateBps}
            onChange={(e) => setTemplateBaseRateBps(Number(e.target.value))}
          />
        </div>
        <button
          disabled={templateBusy}
          onClick={handleCreateTemplate}
          className="btn-secondary mt-2 !border-cobalt !text-cobalt hover:!bg-cobalt hover:!text-paper"
        >
          {templateBusy ? "Creating…" : "Create Template"}
        </button>
        {templateError && (
          <p className="mt-2 font-data text-xs text-vermilion">{templateError}</p>
        )}
        {createdTemplateId && (
          <p className="mt-2 font-data text-xs text-lime">
            Created {createdTemplateId} — Template ID below has been filled in for you.
          </p>
        )}
      </section>

      <section className="border border-carbon p-4">
        <h2 className="font-data text-xs uppercase tracking-wider text-fog">H. Coverage Period</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <input
            className="field"
            placeholder="Pool ID"
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
          />
          <input
            className="field"
            placeholder="Template ID"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          />
          <input
            type="number"
            className="field"
            placeholder="Max payout"
            value={maxPayout}
            onChange={(e) => setMaxPayout(Number(e.target.value))}
          />
          <input
            type="number"
            className="field"
            placeholder="Duration (days)"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          />
          <input
            className="field col-span-2"
            placeholder="Beneficiary address (defaults to your account)"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
        </div>
      </section>

      {errors.length > 0 && (
        <div className="border border-vermilion p-3">
          {errors.map((e) => (
            <p key={e} className="font-data text-xs text-vermilion">
              {e}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleQuote}
          className="btn-secondary"
        >
          Get Quote
        </button>
        <button
          onClick={handlePurchase}
          disabled={!quote}
          className="btn-primary"
        >
          Purchase Policy
        </button>
      </div>

      {quote && (
        <div className="border border-carbon p-4 font-data text-sm">
          <p>Premium: {quote.premium}</p>
          <p>Required reserve: {quote.required_reserve}</p>
          <p>Available capacity: {quote.available_capacity}</p>
          <p>Sufficient capacity: {String(quote.sufficient_capacity)}</p>
        </div>
      )}

      {txStatus && (
        <div className="space-y-2">
          <TransactionRail status={txStatus} />
          {txHash && (
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="font-data text-xs text-cobalt underline"
            >
              View receipt on explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}

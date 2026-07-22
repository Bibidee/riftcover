"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { reads, Claim, EvidenceItem } from "@/lib/genlayer/reads";
import { parseVerdict } from "@/lib/domain/claim";
import { EvidenceLane } from "@/components/claims/EvidenceLane";
import { DecisionSpecimen } from "@/components/claims/DecisionSpecimen";

export default function DecisionDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [verdictJson, setVerdictJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setClaim(await reads.getClaim(claimId));
        setEvidence(await reads.getClaimEvidence(claimId));
        setVerdictJson(await reads.getClaimVerdict(claimId));
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, [claimId]);

  if (error) return <p className="border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">{error}</p>;
  if (!claim) return <p className="font-data text-xs text-fog">Loading…</p>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DecisionSpecimen
        verdict={parseVerdict(verdictJson)}
        claimStatus={claim.status}
        payoutBps={claim.payout_bps}
        claimId={claimId}
      />
      <EvidenceLane title="Accepted / Submitted Evidence" items={evidence} />
    </div>
  );
}

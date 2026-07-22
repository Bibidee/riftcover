"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { reads } from "@/lib/genlayer/reads";
import { ClippedPanel } from "@/components/shared/ClippedPanel";
import { MeasurementLabel } from "@/components/shared/MeasurementLabel";

/**
 * RiftCover does not maintain a separate dependency registry — each policy's
 * Dependency Passport (stored on the policy) is the dependency record. This
 * route treats :dependencyId as a policy id for the first version.
 */
export default function DependencyDetailPage() {
  const { dependencyId } = useParams<{ dependencyId: string }>();
  const [passport, setPassport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await reads.getPolicyPassport(dependencyId);
        setPassport(JSON.parse(raw));
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  }, [dependencyId]);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-carbon">Dependency Passport</h1>
      {error && (
        <p className="mt-4 border-2 border-vermilion bg-vermilion/[0.04] p-3 font-data text-xs text-vermilion">
          {error}
        </p>
      )}
      {passport && (
        <ClippedPanel className="mt-6 p-4">
          <MeasurementLabel label="Dependency" value={passport.dependency_name} />
          <MeasurementLabel label="Provider" value={passport.provider_name} />
          <MeasurementLabel label="Protected capability" value={passport.protected_capability} />
          <MeasurementLabel label="Registered workflow" value={passport.registered_workflow} />
          <MeasurementLabel
            label="Official domains"
            value={(passport.official_domains ?? []).join(", ")}
          />
          <MeasurementLabel
            label="Required notice"
            value={`${passport.required_notice_days} days`}
          />
        </ClippedPanel>
      )}
    </div>
  );
}

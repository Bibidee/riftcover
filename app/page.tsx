import Link from "next/link";
import { DependencyWaveform } from "@/components/laboratory/DependencyWaveform";
import { ClippedPanel } from "@/components/shared/ClippedPanel";

const STEPS = [
  ["01", "REGISTER THE ASSUMPTION"],
  ["02", "MONITOR THE EXTERNAL SIGNAL"],
  ["03", "ADJUDICATE THE RUPTURE"],
] as const;

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section>
        <h1 className="font-display text-4xl uppercase leading-tight text-carbon md:text-6xl">
          Insure the assumptions
          <br />
          your software runs on.
        </h1>
        <p className="mt-4 max-w-2xl font-body text-carbon">
          Parametric protection for API shutdowns, model retirements, platform restrictions
          and critical dependency failures, resolved through decentralized AI-validator
          consensus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/policies/new"
            className="btn-primary"
          >
            Register a Dependency
          </Link>
          <Link
            href="/observatory"
            className="btn-secondary"
          >
            Inspect Live Events
          </Link>
        </div>
      </section>

      <ClippedPanel clipCorner className="p-6">
        <span className="font-data text-xs uppercase tracking-wider text-fog">
          DEPENDENCY SIGNAL — MODEL-X API
        </span>
        <DependencyWaveform ruptured />
        <div className="grid grid-cols-1 gap-1 font-data text-xs uppercase tracking-wider md:grid-cols-3">
          <span className="text-carbon">BASELINE STABLE</span>
          <span className="text-vermilion">LIVE STATE MATERIAL CHANGE DETECTED</span>
          <span className="text-vermilion">DELTA SERVICE WITHDRAWAL</span>
        </div>
      </ClippedPanel>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map(([num, label]) => (
          <div key={num} className="border border-carbon p-4">
            <span className="font-display text-2xl text-cobalt">{num}</span>
            <p className="mt-2 font-data text-xs uppercase tracking-wider text-carbon">{label}</p>
          </div>
        ))}
      </section>

      <p className="font-data text-xs uppercase tracking-wider text-fog">
        Illustrative example shown above. Live dependency signals are on the
        Observatory page, read directly from the deployed contract.
      </p>
    </div>
  );
}

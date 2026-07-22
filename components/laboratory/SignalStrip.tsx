import Link from "next/link";
import { StatusStamp } from "@/components/shared/StatusStamp";
import { formatWeiToGen } from "@/lib/formatting/money";

export interface SignalStripData {
  id: string;
  name: string;
  /** Wei-denominated GEN, as a decimal string. */
  coverage: string;
  policies: number;
  state: string;
  lastChecked: string;
}

/** A monitored dependency rendered as a horizontal record, not a rounded card. */
export function SignalStrip({ data, href }: { data: SignalStripData; href: string }) {
  return (
    <Link
      href={href}
      className="group relative block border-b border-fog-soft px-4 py-3.5 transition-colors last:border-b-0 hover:bg-cobalt/[0.04]"
    >
      <span className="absolute inset-y-0 left-0 w-0.5 bg-cobalt opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-data text-sm font-medium uppercase tracking-wider text-carbon">
          {data.name}
        </span>
        <StatusStamp status={data.state} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 font-data text-xs text-fog">
        <span>Coverage {formatWeiToGen(data.coverage)} GEN</span>
        <span>Policies {data.policies}</span>
        <span>Last checked {data.lastChecked}</span>
      </div>
    </Link>
  );
}

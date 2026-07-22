import { formatWeiToGen } from "@/lib/formatting/money";

export interface TopologyGroup {
  category: string;
  /** `reserved` is wei-denominated GEN, as a decimal string. */
  entries: { name: string; reserved: string }[];
}

/** Portfolio exposure as a topology tree, not a pie chart (per spec). */
export function TopologyTree({ groups }: { groups: TopologyGroup[] }) {
  return (
    <div className="space-y-5 font-data text-sm">
      {groups.map((group) => (
        <div key={group.category} className="border border-carbon">
          <div className="border-b border-carbon bg-carbon px-3 py-1.5 font-medium uppercase tracking-wide2 text-paper">
            {group.category}
          </div>
          <div className="divide-y divide-fog-soft">
            {group.entries.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 px-3 py-2 text-fog">
                <span className="h-1.5 w-1.5 shrink-0 bg-cobalt" />
                <span className="flex-1 text-carbon">{entry.name}</span>
                <span className="font-tabular text-carbon">{formatWeiToGen(entry.reserved)} GEN reserved</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

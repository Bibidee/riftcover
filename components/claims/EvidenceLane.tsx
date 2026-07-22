import { EvidenceItem } from "@/lib/genlayer/reads";
import { EvidenceSourceTag } from "./EvidenceSourceTag";
import { ClippedPanel } from "@/components/shared/ClippedPanel";

export function EvidenceLane({ title, items }: { title: string; items: EvidenceItem[] }) {
  return (
    <ClippedPanel className="p-4">
      <h3 className="font-display text-sm uppercase tracking-wider text-carbon">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 && (
          <p className="font-data text-xs italic text-fog">No evidence submitted yet.</p>
        )}
        {items.map((item) => (
          <div key={item.index} className="border-t border-fog-soft pt-2.5 first:border-t-0 first:pt-0">
            <EvidenceSourceTag sourceClass={item.source_class} />
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block break-all font-data text-xs text-cobalt underline decoration-cobalt/30 underline-offset-2 hover:decoration-cobalt"
            >
              {item.url}
            </a>
            {item.description && (
              <p className="mt-1 font-body text-xs text-ink">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </ClippedPanel>
  );
}

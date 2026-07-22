export function EvidenceSourceTag({ sourceClass }: { sourceClass: string }) {
  const official = sourceClass.startsWith("OFFICIAL_") || sourceClass === "ARCHIVED_OFFICIAL_PAGE";
  return (
    <span
      className={`tag-chip text-[10px] ${
        official ? "border-cobalt bg-cobalt/[0.06] text-cobalt" : "border-fog-soft text-fog"
      }`}
    >
      {sourceClass.replace(/_/g, " ")}
    </span>
  );
}

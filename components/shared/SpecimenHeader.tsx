export function SpecimenHeader({
  eyebrow,
  title,
  specimenNumber,
}: {
  eyebrow: string;
  title: string;
  specimenNumber?: string;
}) {
  return (
    <div className="border-b-2 border-carbon pb-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-data text-xs uppercase tracking-[0.2em] text-cobalt">
          <span className="h-1.5 w-1.5 bg-cobalt" />
          {eyebrow}
        </span>
        {specimenNumber && (
          <span className="border border-fog-soft px-2 py-0.5 font-data text-xs uppercase tracking-wider text-fog">
            SPECIMEN {specimenNumber}
          </span>
        )}
      </div>
      <h1 className="mt-1 font-display text-3xl uppercase leading-[1.05] text-carbon md:text-4xl">
        {title}
      </h1>
    </div>
  );
}

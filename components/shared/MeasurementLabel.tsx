export function MeasurementLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-fog-soft py-2 last:border-b-0">
      <span className="font-data text-xs uppercase tracking-wide2 text-fog">{label}</span>
      <span className="font-tabular truncate font-data text-sm font-medium text-carbon">{value}</span>
    </div>
  );
}

/**
 * Cobalt horizontal waveform that becomes displaced by a vermilion rupture
 * when `ruptured` is true — the homepage hero instrument from the spec.
 */
export function DependencyWaveform({ ruptured = false }: { ruptured?: boolean }) {
  const points = ruptured
    ? "0,30 40,30 60,10 80,50 100,15 140,30 200,30 240,30 280,30 320,30"
    : "0,30 320,30";

  return (
    <svg
      viewBox="0 0 320 60"
      className="h-16 w-full"
      role="img"
      aria-label={ruptured ? "Dependency signal displaced by a rupture" : "Dependency signal stable"}
    >
      <line x1="0" y1="30" x2="320" y2="30" stroke="#9A87C2" strokeWidth="1" strokeDasharray="2 4" />
      <polyline
        points={points}
        fill="none"
        stroke={ruptured ? "#FF2E93" : "#8B2FE0"}
        strokeWidth="2.5"
      />
      {ruptured && <circle cx="80" cy="50" r="3.5" fill="#FF2E93" />}
    </svg>
  );
}

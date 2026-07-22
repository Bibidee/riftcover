export function formatMinorUnits(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

export function formatTimestamp(unixSeconds: number): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function formatCountdown(targetUnixSeconds: number, nowUnixSeconds: number): string {
  const delta = targetUnixSeconds - nowUnixSeconds;
  if (delta <= 0) return "ELAPSED";
  const days = Math.floor(delta / 86400);
  const hours = Math.floor((delta % 86400) / 3600);
  return `${days}D ${hours}H REMAINING`;
}

export function availableCapital(totalCapital: number, reservedCapital: number): number {
  return totalCapital - reservedCapital;
}

export function utilizationPercent(totalCapital: number, reservedCapital: number): number {
  if (totalCapital === 0) return 0;
  return Math.round((reservedCapital / totalCapital) * 100);
}

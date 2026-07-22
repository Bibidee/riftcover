const WEI_PER_GEN = 10n ** 18n;

/**
 * Parses a human-entered GEN decimal string (e.g. "1.25", "0.000001") into an
 * exact wei bigint. Deliberately does NOT go through Number/parseFloat at any
 * point -- floating point cannot represent most decimal GEN amounts exactly
 * (e.g. 0.1 GEN), and Math.floor(gen * 1e18) silently corrupts large or
 * many-decimal inputs. This does pure string/BigInt arithmetic instead.
 *
 * Throws on: empty input, non-numeric characters, more than one decimal
 * point, negative numbers, or more than 18 fractional digits (GEN's
 * precision, matching wei/GEN = 10^18).
 */
export function parseGenToWei(input: string): bigint {
  const trimmed = input.trim();
  if (trimmed === "") {
    throw new Error("Amount is required");
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid GEN amount: "${input}" (must be a non-negative decimal, e.g. "1.25")`);
  }

  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  if (fractionalPart.length > 18) {
    throw new Error(
      `Invalid GEN amount: "${input}" has more than 18 decimal places (GEN's precision limit)`,
    );
  }

  const paddedFraction = fractionalPart.padEnd(18, "0");
  const wholeWei = BigInt(wholePart) * WEI_PER_GEN;
  const fractionalWei = BigInt(paddedFraction || "0");
  return wholeWei + fractionalWei;
}

/**
 * Formats a wei amount (bigint, or a numeric string as returned from a
 * contract read) back into a human GEN decimal string, trimming trailing
 * zeros. Never routes through Number -- wei amounts can exceed
 * Number.MAX_SAFE_INTEGER (2^53) well before reaching 1 whole GEN's worth of
 * typical policy amounts.
 */
export function formatWeiToGen(wei: string | bigint): string {
  const value = typeof wei === "bigint" ? wei : BigInt(wei);
  const negative = value < 0n;
  const abs = negative ? -value : value;

  const whole = abs / WEI_PER_GEN;
  const fraction = abs % WEI_PER_GEN;

  if (fraction === 0n) {
    return `${negative ? "-" : ""}${whole.toString()}`;
  }

  const fractionStr = fraction.toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toString()}.${fractionStr}`;
}

/** Formats a raw wei string/bigint with thousands separators, for display of large integer counters (not GEN amounts). */
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

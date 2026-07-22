const FORBIDDEN_SUBSTRINGS = ["localhost", "127.0.0.1", "0.0.0.0", "@", "10.", "192.168.", "169.254."];

/** Mirrors contracts/riftcover.py::_validate_url. Not a trust boundary. */
export function validateEvidenceUrl(url: string): string | null {
  if (!url || url.length > 500) return "URL must be 1-500 characters";
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return "URL must use http:// or https://";
  }
  const lowered = url.toLowerCase();
  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    if (lowered.includes(forbidden)) {
      return "URL targets a disallowed address or embeds credentials";
    }
  }
  return null;
}

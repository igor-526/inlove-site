export const POLICY_URL_FALLBACK = "/privacy";

/** Preserve safe configured URLs and route every unusable value to the local policy. */
export function normalizePolicyUrl(value?: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || /[\\\s]/.test(trimmed)) return POLICY_URL_FALLBACK;
  if (trimmed === "/about#privacy") return POLICY_URL_FALLBACK;
  const internal = trimmed.startsWith("/") && !trimmed.startsWith("//");
  if (!internal && !/^https?:\/\//i.test(trimmed)) return POLICY_URL_FALLBACK;
  try {
    const url = new URL(trimmed, "https://policy.invalid");
    if (url.username || url.password) return POLICY_URL_FALLBACK;
    return trimmed;
  } catch {
    return POLICY_URL_FALLBACK;
  }
}

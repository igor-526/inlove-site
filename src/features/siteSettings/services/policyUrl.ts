/** Missing/unsafe URLs and the retired about fragment have no link fallback. */
export function normalizePolicyUrl(value?: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || /[\\\s]/.test(trimmed)) return "";
  const internal = trimmed.startsWith("/") && !trimmed.startsWith("//");
  if (!internal && !/^https?:\/\//i.test(trimmed)) return "";
  try {
    const url = new URL(trimmed, "https://policy.invalid");
    if (url.username || url.password) return "";
    if (internal && url.pathname.replace(/\/$/, "") === "/about" && decodeURIComponent(url.hash) === "#privacy") return "";
    return trimmed;
  } catch {
    return "";
  }
}

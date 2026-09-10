export function parseCoordinates(value: unknown): { lat: number; lng: number } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const point = value as Record<string, unknown>;
  const lat = point.latitude ?? point.lat;
  const lng = point.longitude ?? point.lng;
  return typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180 ? { lat, lng } : undefined;
}

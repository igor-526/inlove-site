export function parseCoordinates(latitude: unknown, longitude: unknown): { lat: number; lng: number } | undefined {
  return typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    ? { lat: latitude, lng: longitude } : undefined;
}

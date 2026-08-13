/**
 * Calculates Haversine distance in meters between two [lat, lng] points
 */
export function getHaversineDistanceMeters(
  point1: [number, number],
  point2: [number, number]
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(point2[0] - point1[0]);
  const dLng = toRad(point2[1] - point1[1]);
  const lat1 = toRad(point1[0]);
  const lat2 = toRad(point2[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates bearing/heading in degrees (0-360) from point1 to point2
 */
export function getHeadingAngle(
  point1: [number, number],
  point2: [number, number]
): number {
  const lat1 = toRad(point1[0]);
  const lat2 = toRad(point2[0]);
  const dLng = toRad(point2[1] - point1[1]);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Formats distance in km or meters
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

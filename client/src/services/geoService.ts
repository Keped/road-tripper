/**
 * Browser Geolocation API wrapper for real GPS tracking mode
 */

export interface GPSPosition {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
  timestamp: number;
}

let watchId: number | null = null;

export function startGPSTracking(
  onLocationUpdate: (pos: GPSPosition) => void,
  onError: (err: GeolocationPositionError) => void
): void {
  stopGPSTracking();

  if (!('geolocation' in navigator)) {
    onError({
      code: 2,
      message: 'Geolocation is not supported by your browser',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, heading, speed, accuracy } = position.coords;
      onLocationUpdate({
        lat: latitude,
        lng: longitude,
        heading: heading !== null && !isNaN(heading) ? heading : null,
        speed: speed !== null && !isNaN(speed) ? speed : null,
        accuracy,
        timestamp: position.timestamp,
      });
    },
    (err) => onError(err),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    }
  );
}

export function stopGPSTracking(): void {
  if (watchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

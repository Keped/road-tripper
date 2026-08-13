export type POICategory = 'historic' | 'markets' | 'hazards' | 'podcasts' | 'hiddenGems';

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  title: string;
  summary: string;
  detail: string;
  latLng: [number, number]; // [lat, lng]
  icon?: string;
  externalUrl?: string; // podcast or article link
  audioClipUrl?: string;
  distanceFromStartKm?: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  distanceKm: number;
  durationMin?: number;
  polyline: [number, number][]; // Array of [lat, lng]
  pois: POI[];
  isPreset?: boolean;
  sourceUrl?: string;
}

export interface SavedRouteSummary {
  id: string;
  name: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  distanceKm: number;
  durationMin?: number;
  sourceUrl?: string;
  createdAt: string;
}

export interface TriggeredAlert {
  poi: POI;
  triggeredAtTimestamp: number;
  distMeters: number;
}

export type TrackingMode = 'idle' | 'simulating' | 'gps';

export interface NotificationSettings {
  historic: boolean;
  markets: boolean;
  hazards: boolean;
  podcasts: boolean;
  hiddenGems: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  speed: 'slow' | 'normal' | 'fast';
}

export interface AppSettings {
  notifications: NotificationSettings;
  voice: VoiceSettings;
  triggerRadiusM: number; // 250, 500, 1000, 2000
  simulationSpeed: number; // 1, 5, 20
  theme: 'dark' | 'light' | 'auto';
}

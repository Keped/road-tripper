import { RouteData } from '../types';
import { route66POIs } from './pois/route66';
import { pchPOIs } from './pois/pch';
import { israel2POIs } from './pois/israel2';

export const PRESET_ROUTES: RouteData[] = [
  {
    id: 'preset-route66',
    name: 'Route 66 — The Mother Road',
    origin: 'Chicago, IL',
    destination: 'Santa Monica, CA',
    distanceKm: 3940,
    durationMin: 2160,
    isPreset: true,
    pois: route66POIs,
    polyline: [
      [41.8795, -87.6243], // Chicago, IL
      [41.2917, -88.1678], // Joliet / Wilmington, IL
      [40.4842, -88.9937], // Bloomington, IL
      [39.8017, -89.6483], // Springfield, IL
      [38.627, -90.1994], // St. Louis, MO
      [38.2435, -91.0905], // Meramec / Stanton, MO
      [37.2089, -93.2923], // Springfield, MO
      [36.154, -95.9928], // Tulsa, OK
      [35.4676, -97.5164], // Oklahoma City, OK
      [35.1872, -101.987], // Amarillo, TX (Cadillac Ranch)
      [35.0844, -106.6504], // Albuquerque, NM
      [35.5281, -108.7426], // Gallup, NM
      [35.1983, -111.6513], // Flagstaff, AZ
      [35.2289, -113.882], // Kingman, AZ
      [34.8958, -117.0173], // Barstow, CA
      [34.0522, -118.2437], // Los Angeles, CA
      [34.0195, -118.4912], // Santa Monica Pier, CA
    ],
  },
  {
    id: 'preset-pch',
    name: 'Pacific Coast Highway (PCH)',
    origin: 'San Francisco, CA',
    destination: 'Los Angeles, CA',
    distanceKm: 740,
    durationMin: 540,
    isPreset: true,
    pois: pchPOIs,
    polyline: [
      [37.7749, -122.4194], // San Francisco, CA
      [36.9741, -122.0308], // Santa Cruz, CA
      [36.6002, -121.8947], // Monterey, CA
      [36.5552, -121.9233], // Carmel-by-the-Sea, CA
      [36.3714, -121.9017], // Bixby Creek Bridge
      [36.2382, -121.8156], // Pfeiffer Big Sur
      [35.9812, -121.4921], // Ragged Point
      [35.6444, -121.1897], // San Simeon (Hearst Castle)
      [35.3658, -120.8499], // Morro Bay, CA
      [35.1428, -120.6413], // Pismo Beach, CA
      [34.4208, -119.6982], // Santa Barbara, CA
      [34.0259, -118.7798], // Malibu, CA
      [34.0522, -118.2437], // Los Angeles, CA
    ],
  },
  {
    id: 'preset-israel2',
    name: 'Israeli Coastal Highway (Route 2)',
    origin: 'Tel Aviv',
    destination: 'Haifa',
    distanceKm: 95,
    durationMin: 70,
    isPreset: true,
    pois: israel2POIs,
    polyline: [
      [32.0853, 34.7818], // Tel Aviv
      [32.1663, 34.8115], // Herzliya
      [32.2612, 34.8398], // Ga'ash / Wingate
      [32.3294, 34.8565], // Netanya
      [32.434, 34.887], // Hadera
      [32.501, 34.8924], // Caesarea
      [32.6952, 34.9381], // Atlit
      [32.8123, 34.9578], // Carmel Coast / Haifa
      [32.8192, 34.9983], // Downtown Haifa
    ],
  },
];

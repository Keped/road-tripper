import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { POI, RouteData } from '../types';

interface MapViewProps {
  route: RouteData;
  carPosition: [number, number];
  carHeading: number;
  triggerRadiusM: number;
  triggeredPoiIds: Set<string>;
  onSelectMarkerPoi?: (poi: POI) => void;
}

// Custom Car Marker DivIcon with smooth CSS rotation
const createCarIcon = (heading: number) =>
  L.divIcon({
    className: 'car-marker-container',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease-out;" class="w-10 h-10 flex items-center justify-center">
        <div class="w-9 h-9 rounded-full bg-cyan-500 border-2 border-slate-950 shadow-xl shadow-cyan-500/50 flex items-center justify-center text-slate-950">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// Custom POI DivIcon
const createPoiIcon = (category: string, isTriggered: boolean) => {
  const getSymbol = () => {
    switch (category) {
      case 'historic':
        return '🏰';
      case 'markets':
        return '🎪';
      case 'hazards':
        return '⚠️';
      case 'podcasts':
        return '🎙️';
      case 'hiddenGems':
      default:
        return '📍';
    }
  };

  const bgClass = isTriggered
    ? 'bg-amber-500 border-amber-300 text-slate-950 scale-125 shadow-amber-500/50 ring-4 ring-amber-500/30'
    : 'bg-slate-900 border-cyan-400 text-slate-100 shadow-slate-950/80 hover:scale-110';

  return L.divIcon({
    className: 'poi-marker-container',
    html: `
      <div class="w-8 h-8 rounded-full border-2 ${bgClass} flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300">
        ${getSymbol()}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// MapRecenter Helper Component
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  route,
  carPosition,
  carHeading,
  triggerRadiusM,
  triggeredPoiIds,
  onSelectMarkerPoi,
}) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      <MapContainer
        center={carPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        attributionControl={false}
      >
        {/* Dark Map Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapRecenter center={carPosition} />

        {/* Route Polyline */}
        <Polyline
          positions={route.polyline}
          pathOptions={{
            color: '#06b6d4', // cyan-500
            weight: 6,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Outer Glow Polyline */}
        <Polyline
          positions={route.polyline}
          pathOptions={{
            color: '#0891b2',
            weight: 12,
            opacity: 0.25,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Geofence Proximity Ring around Car */}
        <Circle
          center={carPosition}
          radius={triggerRadiusM}
          pathOptions={{
            color: '#22d3ee',
            fillColor: '#06b6d4',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '4, 8',
          }}
        />

        {/* Car Position Marker */}
        <Marker position={carPosition} icon={createCarIcon(carHeading)} />

        {/* POI Markers */}
        {(route.pois || []).map((poi) => (
          <Marker
            key={poi.id}
            position={poi.latLng}
            icon={createPoiIcon(poi.category, triggeredPoiIds.has(poi.id))}
            eventHandlers={{
              click: () => onSelectMarkerPoi?.(poi),
            }}
          />
        ))}
      </MapContainer>

      {/* Attribution Overlay */}
      <div className="absolute bottom-2 left-2 z-20 px-2 py-1 bg-slate-950/70 backdrop-blur-md rounded text-[10px] text-slate-400 border border-slate-800">
        © OpenStreetMap © CARTO
      </div>
    </div>
  );
};

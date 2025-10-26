'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface ClickLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  count: number;
}

interface ClickMapProps {
  clicks: Array<{
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }>;
}

export function ClickMap({ clicks }: ClickMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Fix Leaflet's default icon issue with webpack
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Debug: Log the clicks data
  console.log('[ClickMap] Total clicks received:', clicks.length);
  console.log('[ClickMap] Clicks data:', clicks);

  // Group clicks by location
  const locations: ClickLocation[] = (() => {
    const locationMap = new Map<string, ClickLocation>();

    clicks.forEach(click => {
      console.log('[ClickMap] Processing click:', click);
      if (click.latitude && click.longitude) {
        console.log('[ClickMap] Click has location:', click.latitude, click.longitude);
        const key = `${click.latitude.toFixed(2)},${click.longitude.toFixed(2)}`;
        const existing = locationMap.get(key);

        if (existing) {
          existing.count++;
        } else {
          locationMap.set(key, {
            latitude: click.latitude,
            longitude: click.longitude,
            city: click.city,
            country: click.country,
            count: 1,
          });
        }
      }
    });

    return Array.from(locationMap.values());
  })();

  // Calculate center and zoom based on locations
  const center: [number, number] = locations.length > 0
    ? [
        locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length,
        locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length,
      ]
    : [20, 0]; // Default to world view

  const zoom = locations.length === 1 ? 10 : locations.length > 0 ? 2 : 2;

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No location data available</p>
          <p className="text-gray-400 text-sm mt-1">Click data will appear here once collected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location, idx) => (
          <CircleMarker
            key={idx}
            center={[location.latitude, location.longitude]}
            radius={Math.min(8 + location.count * 2, 20)}
            fillColor="#3b82f6"
            color="#1d4ed8"
            weight={2}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{location.count} click{location.count > 1 ? 's' : ''}</p>
                {location.city && <p>{location.city}</p>}
                {location.country && <p>{location.country}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

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

  // Always show full world map view
  const center: [number, number] = [20, 0]; // Center of world map
  const zoom = 2; // World view zoom level

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
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Grayscale map tiles from Stamen Toner Lite */}
        <TileLayer
          attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
          url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
        />
        {locations.map((location, idx) => (
          <CircleMarker
            key={idx}
            center={[location.latitude, location.longitude]}
            radius={8}
            fillColor="#10b981"
            color="#059669"
            weight={2}
            opacity={0.9}
            fillOpacity={0.7}
            pathOptions={{
              className: 'subtle-pulse-dot'
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{location.count} click{location.count > 1 ? 's' : ''}</p>
                {location.city && <p className="text-gray-700">{location.city}</p>}
                {location.country && <p className="text-gray-600">{location.country}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* CSS for subtle animated dots */}
      <style jsx global>{`
        .leaflet-interactive.subtle-pulse-dot {
          animation: subtle-pulse 3s ease-in-out infinite;
        }

        @keyframes subtle-pulse {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
}

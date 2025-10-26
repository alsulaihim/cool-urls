'use client';

import {
  Map as LeafletMap,
  MapTileLayer,
  MapMarker,
  MapPopup
} from '@/components/ui/map';
import { MapPin, Globe2 } from 'lucide-react';

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

  if (locations.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 relative overflow-hidden">
        <div className="text-center relative z-10 px-4">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 border border-pink-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 bg-pink-50">
            <Globe2 className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500" strokeWidth={1.5} />
          </div>
          <p className="text-foreground font-semibold text-base sm:text-lg">No location data available</p>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">Click data will appear here once collected</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LeafletMap
        className="w-full h-[350px] sm:h-[450px] md:h-[600px]"
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapTileLayer />
        {locations.map((location, idx) => (
          <MapMarker
            key={idx}
            position={[location.latitude, location.longitude]}
            radius={8}
            fillColor="#EC4899"
            color="#000000"
            weight={2}
            opacity={0.8}
            fillOpacity={0.6}
            className="subtle-pulse-dot"
          >
            <MapPopup>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 border border-pink-500/20 rounded-full flex items-center justify-center bg-pink-50">
                    <MapPin className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">
                      {location.count} click{location.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {(location.city || location.country) && (
                  <div className="pt-1 border-t border-border">
                    {location.city && <p className="text-sm font-medium text-foreground">{location.city}</p>}
                    {location.country && <p className="text-xs text-muted-foreground">{location.country}</p>}
                  </div>
                )}
              </div>
            </MapPopup>
          </MapMarker>
        ))}
      </LeafletMap>

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
    </>
  );
}

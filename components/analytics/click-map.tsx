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

  console.log('[ClickMap] Locations to display:', locations);

  if (locations.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 relative overflow-hidden">
        <div className="text-center relative z-10 px-4">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 border border-[#3B82F6]/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 bg-[#3B82F6]/5">
            <Globe2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#3B82F6]" strokeWidth={1.5} />
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
        {locations.map((location, idx) => {
          // Calculate marker size based on click count
          const baseRadius = 8;
          const maxRadius = 20;
          const maxCount = Math.max(...locations.map(l => l.count));
          const radius = location.count > 1
            ? baseRadius + ((location.count / maxCount) * (maxRadius - baseRadius))
            : baseRadius;

          return (
            <MapMarker
              key={idx}
              position={[location.latitude, location.longitude]}
              radius={radius}
              fillColor="#3B82F6"
              color="#000000"
              weight={2}
              opacity={0.9}
              fillOpacity={0.6}
              className="subtle-pulse-dot"
            >
              <MapPopup>
                <div className="space-y-2 min-w-[160px]">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 border border-[#3B82F6]/20 rounded-full flex items-center justify-center bg-[#3B82F6]/10 shrink-0">
                      <MapPin className="w-4 h-4 text-[#3B82F6]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {(location.city || location.country) ? (
                        <>
                          {location.city && (
                            <p className="font-bold text-foreground text-base leading-tight">
                              {location.city}
                            </p>
                          )}
                          {location.country && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {location.country}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-semibold text-foreground text-sm">
                          Unknown Location
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Clicks</span>
                      <span className="text-lg font-bold text-[#3B82F6]">
                        {location.count}
                      </span>
                    </div>
                  </div>
                </div>
              </MapPopup>
            </MapMarker>
          );
        })}
      </LeafletMap>

      {/* CSS for subtle animated dots */}
      <style jsx global>{`
        .leaflet-interactive.subtle-pulse-dot {
          animation: subtle-pulse 2.5s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .leaflet-interactive.subtle-pulse-dot:hover {
          animation: none;
          opacity: 1 !important;
          transform: scale(1.2);
        }

        @keyframes subtle-pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

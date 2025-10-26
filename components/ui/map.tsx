'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Dynamically import Leaflet to avoid SSR issues
const MapContainerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const CircleMarkerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const PopupComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
  children?: React.ReactNode;
}

const Map = React.forwardRef<HTMLDivElement, MapProps>(
  ({ className, center = [20, 0], zoom = 2, scrollWheelZoom = true, zoomControl = true, children, ...props }, ref) => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
      setIsMounted(true);

      // Initialize Leaflet icons
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

    if (!isMounted) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex h-full w-full items-center justify-center rounded-lg border border-border bg-muted',
            className
          )}
          {...props}
        >
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('h-full w-full overflow-hidden rounded-lg border border-border', className)} {...props}>
        <MapContainerComponent
          center={center}
          zoom={zoom}
          scrollWheelZoom={scrollWheelZoom}
          zoomControl={zoomControl}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          {children}
        </MapContainerComponent>
      </div>
    );
  }
);

Map.displayName = 'Map';

const MapTileLayer = React.forwardRef<
  any,
  {
    url?: string;
    attribution?: string;
  }
>(({ url, attribution }, ref) => {
  return (
    <TileLayerComponent
      ref={ref}
      attribution={
        attribution ||
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
      url={url || 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
    />
  );
});

MapTileLayer.displayName = 'MapTileLayer';

interface MapMarkerProps {
  position: [number, number];
  radius?: number;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
  opacity?: number;
  className?: string;
  children?: React.ReactNode;
}

const MapMarker = React.forwardRef<any, MapMarkerProps>(
  (
    {
      position,
      radius = 8,
      color = 'hsl(var(--primary))',
      fillColor = 'hsl(var(--primary))',
      fillOpacity = 0.7,
      weight = 2,
      opacity = 0.9,
      className,
      children,
    },
    ref
  ) => {
    return (
      <CircleMarkerComponent
        ref={ref}
        center={position}
        radius={radius}
        color={color}
        fillColor={fillColor}
        fillOpacity={fillOpacity}
        weight={weight}
        opacity={opacity}
        pathOptions={{ className }}
      >
        {children}
      </CircleMarkerComponent>
    );
  }
);

MapMarker.displayName = 'MapMarker';

interface MapPopupProps {
  children: React.ReactNode;
}

const MapPopup = React.forwardRef<any, MapPopupProps>(({ children }, ref) => {
  return (
    <PopupComponent ref={ref}>
      <div className="text-sm">{children}</div>
    </PopupComponent>
  );
});

MapPopup.displayName = 'MapPopup';

export { Map, MapTileLayer, MapMarker, MapPopup };

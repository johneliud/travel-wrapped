import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProcessedTrip, EnhancedTrip, LatLng } from '../../types/travel';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  trips: ProcessedTrip[] | EnhancedTrip[];
  className?: string;
}

interface FitBoundsProps {
  bounds: L.LatLngBoundsExpression;
}

// Component to fit map bounds to show all markers
const FitBounds: React.FC<FitBoundsProps> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);
  
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ trips, className = '' }) => {
  // Extract unique locations from trips
  const { locations, polylinePoints, bounds } = useMemo(() => {
    const locationMap = new Map<string, { latLng: LatLng; trips: (ProcessedTrip | EnhancedTrip)[] }>();
    const polylinePoints: L.LatLngExpression[] = [];
    
    trips.forEach(trip => {
      // For ProcessedTrip, use startLocation and endLocation
      if ('startLocation' in trip) {
        const startKey = `${trip.startLocation.latitude},${trip.startLocation.longitude}`;
        if (!locationMap.has(startKey)) {
          locationMap.set(startKey, { latLng: trip.startLocation, trips: [] });
        }
        locationMap.get(startKey)!.trips.push(trip);
        
        if (trip.endLocation) {
          const endKey = `${trip.endLocation.latitude},${trip.endLocation.longitude}`;
          if (!locationMap.has(endKey)) {
            locationMap.set(endKey, { latLng: trip.endLocation, trips: [] });
          }
          locationMap.get(endKey)!.trips.push(trip);
          
          // Add to polyline
          polylinePoints.push([trip.startLocation.latitude, trip.startLocation.longitude]);
          polylinePoints.push([trip.endLocation.latitude, trip.endLocation.longitude]);
        }
      }
      // For EnhancedTrip, use location and endLocation
      else if ('location' in trip) {
        const startKey = `${trip.location.latitude},${trip.location.longitude}`;
        if (!locationMap.has(startKey)) {
          locationMap.set(startKey, { latLng: trip.location, trips: [] });
        }
        locationMap.get(startKey)!.trips.push(trip);
        
        if (trip.endLocation) {
          const endKey = `${trip.endLocation.latitude},${trip.endLocation.longitude}`;
          if (!locationMap.has(endKey)) {
            locationMap.set(endKey, { latLng: trip.endLocation, trips: [] });
          }
          locationMap.get(endKey)!.trips.push(trip);
          
          // Add to polyline
          polylinePoints.push([trip.location.latitude, trip.location.longitude]);
          polylinePoints.push([trip.endLocation.latitude, trip.endLocation.longitude]);
        }
      }
    });
    
    const locations = Array.from(locationMap.values());
    
    // Calculate bounds to fit all locations
    let bounds: L.LatLngBoundsExpression | null = null;
    if (locations.length > 0) {
      const latLngs: L.LatLngExpression[] = locations.map(loc => [loc.latLng.latitude, loc.latLng.longitude]);
      bounds = L.latLngBounds(latLngs);
    }
    
    return { locations, polylinePoints, bounds };
  }, [trips]);

  // Default center (world center) if no trips
  const defaultCenter: L.LatLngExpression = [20, 0];
  const defaultZoom = 2;

  if (trips.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p>No trips to display on map</p>
        </div>
      </div>
    );
  }

  
};

export default MapView;
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

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Fit bounds to show all markers */}
        {bounds && <FitBounds bounds={bounds} />}
        
        {/* Polylines connecting locations */}
        {polylinePoints.length > 0 && (
          <Polyline
            positions={polylinePoints}
            color="#3b82f6"
            weight={2}
            opacity={0.6}
          />
        )}
        
        {/* Markers for each unique location */}
        {locations.map((location, index) => (
          <Marker
            key={`${location.latLng.latitude},${location.latLng.longitude}`}
            position={[location.latLng.latitude, location.latLng.longitude]}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">
                  📍 Location {index + 1}
                </div>
                <div className="mb-2 text-xs text-gray-600">
                  {location.latLng.latitude.toFixed(4)}, {location.latLng.longitude.toFixed(4)}
                </div>
                <div className="space-y-1">
                  {location.trips.slice(0, 3).map((trip, tripIndex) => {
                    const placeName = 'placeName' in trip ? trip.placeName : 
                                   'city' in trip ? trip.city : 'Unknown Location';
                    const country = 'country' in trip ? trip.country : '';
                    
                    return (
                      <div key={`${trip.id}-${tripIndex}`} className="text-xs">
                        <div className="font-medium">
                          {placeName || 'Unknown Location'}
                          {country && ` (${country})`}
                        </div>
                        <div className="text-gray-500">
                          {trip.startTime.toLocaleDateString()}
                          {'weather' in trip && trip.weather && (
                            <span className="ml-1">
                              {trip.weather.temperature}°C {trip.weather.icon}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {location.trips.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{location.trips.length - 3} more trips
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map controls info */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 z-[1000]">
        {locations.length} locations • {trips.length} trips
      </div>
    </div>
  );
};

export default MapView;
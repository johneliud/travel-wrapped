import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
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

interface TileLayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

const TILE_LAYERS: TileLayerConfig[] = [
  {
    name: 'Bright',
    url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 20
  },
  {
    name: 'Outdoors',
    url: 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 20
  },
  {
    name: 'Dark',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 20
  },
  {
    name: 'Watercolor',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  },
  {
    name: 'Terrain',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }
];

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
  const [selectedTileLayer, setSelectedTileLayer] = useState<TileLayerConfig>(TILE_LAYERS[0]);

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

  // Create custom markers with weather icons
  const createCustomMarker = (trip: ProcessedTrip | EnhancedTrip): L.Icon | L.DivIcon => {
    // Check if it's an enhanced trip with weather data
    if ('weather' in trip && trip.weather) {
      const iconHtml = `
        <div class="flex flex-col items-center">
          <div class="bg-white rounded-full p-1 shadow-lg border-2 border-blue-500 mb-1">
            <span class="text-base">${trip.weather.icon}</span>
          </div>
          <div class="bg-blue-500 text-white text-xs px-1 rounded text-center min-w-8">
            ${Math.round(trip.weather.temperature)}°
          </div>
        </div>
      `;
      
      return L.divIcon({
        html: iconHtml,
        className: 'custom-weather-marker',
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [0, -48]
      });
    }
    
    // Enhanced trip without weather - use country flag if available
    if ('country' in trip && 'countryCode' in trip && trip.countryCode) {
      const flag = trip.countryCode ? `&#x1F1${String.fromCharCode(0x45 + trip.countryCode.charCodeAt(0) - 0x41)}&#x1F1${String.fromCharCode(0x45 + trip.countryCode.charCodeAt(1) - 0x41)}` : '📍';
      const iconHtml = `
        <div class="bg-white rounded-full p-1 shadow-lg border-2 border-green-500">
          <span class="text-base">${flag}</span>
        </div>
      `;
      
      return L.divIcon({
        html: iconHtml,
        className: 'custom-flag-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    }
    
    // Default marker for basic trips
    return new L.Icon.Default();
  };

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
          key={selectedTileLayer.name}
          url={selectedTileLayer.url}
          attribution={selectedTileLayer.attribution}
          maxZoom={selectedTileLayer.maxZoom}
        />
        
        {/* Fit bounds to show all markers */}
        {bounds && <FitBounds bounds={bounds} />}
        
        {/* Enhanced Polylines with gradient effect */}
        {polylinePoints.length > 0 && (
          <Polyline
            positions={polylinePoints}
            color="#8b5cf6"
            weight={3}
            opacity={0.7}
            dashArray="5, 10"
            className="animate-pulse"
          />
        )}
        
        {/* Additional polyline for travel routes */}
        {polylinePoints.length > 0 && (
          <Polyline
            positions={polylinePoints}
            color="#06b6d4"
            weight={1}
            opacity={0.4}
          />
        )}
        
        {/* Markers for each unique location */}
        {locations.map((location, index) => {
          const representativeTrip = location.trips[0]; // Use first trip for marker styling
          return (
            <Marker
              key={`${location.latLng.latitude},${location.latLng.longitude}`}
              position={[location.latLng.latitude, location.latLng.longitude]}
              icon={createCustomMarker(representativeTrip)}
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
        );
        })}
      </MapContainer>
      
      {/* Map Style Selector */}
      <div className="absolute top-2 right-2 z-[1000]">
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 overflow-hidden">
          <select
            value={selectedTileLayer.name}
            onChange={(e) => {
              const layer = TILE_LAYERS.find(l => l.name === e.target.value);
              if (layer) setSelectedTileLayer(layer);
            }}
            className="bg-transparent px-3 py-2 text-sm focus:outline-none appearance-none pr-8 cursor-pointer"
          >
            {TILE_LAYERS.map(layer => (
              <option key={layer.name} value={layer.name}>
                🗺️ {layer.name}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-600">
            ▼
          </div>
        </div>
      </div>
      
      {/* Map controls info */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 px-3 py-2 z-[1000]">
        <div className="flex items-center space-x-3 text-xs text-gray-700">
          <div className="flex items-center space-x-1">
            <span className="text-blue-500">📍</span>
            <span>{locations.length} locations</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center space-x-1">
            <span className="text-purple-500">✈️</span>
            <span>{trips.length} trips</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
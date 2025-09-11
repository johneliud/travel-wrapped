import React, { useState, useCallback, useEffect, useRef } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import type { ManualTrip } from '../../types/travel';
import { GeocodingService, type LocationInfo } from '../../services/geocoding';
import { CountriesService } from '../../services/countries';

interface ManualEntryProps {
  onAddTrip: (trip: ManualTrip) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export const ManualEntry: React.FC<ManualEntryProps> = ({
  onAddTrip,
  onClose,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ManualTrip>({
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<ManualTrip>>({});
  const [showEndDate, setShowEndDate] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string>('');
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize countries service
  useEffect(() => {
    CountriesService.initialize().catch(err => {
      console.warn('Failed to initialize countries service:', err);
    });
  }, []);

  // Handle clicks outside of suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced geocoding for city input
  const performGeocoding = useCallback(async (cityInput: string) => {
    if (!cityInput.trim() || cityInput.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsGeocoding(true);
    setGeocodingError('');

    try {
      const result = await GeocodingService.forwardGeocode(cityInput);
      
      if (result.coords) {
        // Also try to get country info if not already provided
        let countryInfo = null;
        if (result.countryCode) {
          countryInfo = await CountriesService.getCountryInfo(result.countryCode);
        }

        const suggestion: LocationInfo = {
          ...result,
          country: countryInfo?.name || result.country,
          countryCode: countryInfo?.code || result.countryCode
        };

        setLocationSuggestions([suggestion]);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        if (result.confidence < 0.3) {
          setGeocodingError('Location not found. Please check the spelling.');
        }
      }
    } catch (error) {
      console.warn('Geocoding failed:', error);
      setGeocodingError('Unable to find location. Please enter manually.');
      setLocationSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!formData.city) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performGeocoding(formData.city);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.city, performGeocoding]);

  const handleLocationSelect = useCallback((suggestion: LocationInfo) => {
    setFormData(prev => ({
      ...prev,
      city: suggestion.city || prev.city,
      country: suggestion.country || prev.country,
      coordinates: suggestion.coords ? {
        latitude: suggestion.coords.latitude,
        longitude: suggestion.coords.longitude
      } : prev.coordinates
    }));
    setShowSuggestions(false);
    setGeocodingError('');
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<ManualTrip> = {};

    // Required field validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (!isValid(parseISO(formData.startDate))) {
      newErrors.startDate = 'Invalid date format';
    }

    // End date validation (if provided)
    if (formData.endDate) {
      if (!isValid(parseISO(formData.endDate))) {
        newErrors.endDate = 'Invalid date format';
      } else {
        const startDate = parseISO(formData.startDate);
        const endDate = parseISO(formData.endDate);
        if (endDate < startDate) {
          newErrors.endDate = 'End date must be after start date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAddTrip(formData);
      // Reset form
      setFormData({
        city: '',
        country: '',
        startDate: '',
        endDate: '',
        notes: ''
      });
      setShowEndDate(false);
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof ManualTrip, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getTodayDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Add Manual Trip</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={isLoading}
          >
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* City */}
        <div className="relative">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <div className="relative">
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Paris"
              disabled={isLoading}
              autoComplete="off"
            />
            {isGeocoding && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* Location Suggestions */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {locationSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {suggestion.city}
                      </div>
                      {suggestion.country && (
                        <div className="text-sm text-gray-500">
                          {suggestion.country}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(suggestion.confidence * 100)}% match
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Geocoding Error */}
          {geocodingError && (
            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700 text-sm">{geocodingError}</p>
            </div>
          )}
          
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.country ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., France"
            disabled={isLoading}
          />
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date Visited *
          </label>
          <input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            max={getTodayDate()}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startDate ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.startDate && (
            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
          )}
        </div>

        {/* End Date Toggle */}
        <div>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showEndDate}
              onChange={(e) => setShowEndDate(e.target.checked)}
              className="rounded"
              disabled={isLoading}
            />
            <span>Multi-day trip</span>
          </label>
        </div>

        {/* End Date */}
        {showEndDate && (
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              min={formData.startDate}
              max={getTodayDate()}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.notes ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Optional notes about this trip..."
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding Trip...</span>
            </div>
          ) : (
            'Add Trip'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>💡 Tip:</strong> Manual trips will be combined with your Timeline data 
          to create a complete travel story.
        </p>
      </div>
    </div>
  );
};
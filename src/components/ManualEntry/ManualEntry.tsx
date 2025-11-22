import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg p-6 w-full border border-gray-100"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Add Manual Trip</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* City */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
            City *
          </label>
          <div className="relative">
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
              }`}
              placeholder="e.g., Paris, Tokyo, New York"
              disabled={isLoading}
              autoComplete="off"
            />
            {isGeocoding && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"
                />
              </div>
            )}
          </div>
          
          {/* Location Suggestions */}
          <AnimatePresence>
            {showSuggestions && locationSuggestions.length > 0 && (
              <motion.div 
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center">
                          <span className="mr-2">📍</span>
                          {suggestion.city}
                        </div>
                        {suggestion.country && (
                          <div className="text-sm text-gray-500 ml-6">
                            {suggestion.country}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded-full">
                        {Math.round(suggestion.confidence * 100)}% match
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Geocoding Error */}
          <AnimatePresence>
            {geocodingError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <p className="text-yellow-700 text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  {geocodingError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {errors.city && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-red-500 text-sm mt-2 flex items-center"
              >
                <span className="mr-1">❌</span>
                {errors.city}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Country */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
            Country
          </label>
          <input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
            }`}
            placeholder="e.g., France, Japan, United States"
            disabled={isLoading}
          />
          <AnimatePresence>
            {errors.country && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-red-500 text-sm mt-2 flex items-center"
              >
                <span className="mr-1">❌</span>
                {errors.country}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Start Date */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Date Visited *
          </label>
          <input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            max={getTodayDate()}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
            }`}
            disabled={isLoading}
          />
          <AnimatePresence>
            {errors.startDate && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-red-500 text-sm mt-2 flex items-center"
              >
                <span className="mr-1">❌</span>
                {errors.startDate}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* End Date Toggle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
        >
          <input
            type="checkbox"
            id="multi-day"
            checked={showEndDate}
            onChange={(e) => setShowEndDate(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            disabled={isLoading}
          />
          <label htmlFor="multi-day" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
            <span className="mr-2">🗓️</span>
            Multi-day trip
          </label>
        </motion.div>

        {/* End Date */}
        <AnimatePresence>
          {showEndDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                min={formData.startDate}
                max={getTodayDate()}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              <AnimatePresence>
                {errors.endDate && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 flex items-center"
                  >
                    <span className="mr-1">❌</span>
                    {errors.endDate}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
              errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
            }`}
            placeholder="Optional notes about this trip..."
            disabled={isLoading}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Adding Trip...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>✈️</span>
              <span>Add Trip</span>
            </div>
          )}
        </motion.button>
      </form>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
      >
        <p className="text-sm text-blue-700 flex items-start">
          <span className="mr-2 text-lg">💡</span>
          <span>
            <strong>Tip:</strong> Manual trips will be combined with your Timeline data 
            to create a complete travel story with enhanced insights.
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
};
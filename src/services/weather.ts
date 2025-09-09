import type { LatLng } from '../types/travel';

export interface WeatherData {
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  humidity?: number;
  precipitation?: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed?: number;
  date: string;
}

export interface HistoricalWeatherParams {
  coords: LatLng;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

export class WeatherService {
  private static readonly BASE_URL = 'https://archive-api.open-meteo.com/v1/era5';
  private static readonly CURRENT_URL = 'https://api.open-meteo.com/v1/forecast';
  private static readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
  private static cache = new Map<string, { data: WeatherData[]; timestamp: number }>();

  /**
   * Get historical weather data for a location and date range
   */
  static async getHistoricalWeather(params: HistoricalWeatherParams): Promise<WeatherData[]> {
    const cacheKey = `${params.coords.latitude.toFixed(2)},${params.coords.longitude.toFixed(2)}-${params.startDate}-${params.endDate}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const url = `${this.BASE_URL}?` + new URLSearchParams({
        latitude: params.coords.latitude.toString(),
        longitude: params.coords.longitude.toString(),
        start_date: params.startDate,
        end_date: params.endDate,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'temperature_2m_mean',
          'precipitation_sum',
          'weather_code',
          'wind_speed_10m_max'
        ].join(','),
        timezone: 'auto'
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.daily) {
        throw new Error('No weather data available for this period');
      }

      const weatherData = this.parseWeatherResponse(data);

      // Cache the results
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;

    } catch (error) {
      console.warn('Failed to fetch historical weather:', error);
      return [];
    }
  }

  
}
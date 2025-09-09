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

  /**
   * Get weather for a single date
   */
  static async getWeatherForDate(coords: LatLng, date: string): Promise<WeatherData | null> {
    const weatherData = await this.getHistoricalWeather({
      coords,
      startDate: date,
      endDate: date
    });

    return weatherData[0] || null;
  }

  /**
   * Get current weather (for recent dates)
   */
  static async getCurrentWeather(coords: LatLng): Promise<WeatherData | null> {
    try {
      const url = `${this.CURRENT_URL}?` + new URLSearchParams({
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'precipitation',
          'weather_code',
          'wind_speed_10m'
        ].join(','),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min'
        ].join(','),
        forecast_days: '1',
        timezone: 'auto'
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return this.parseCurrentWeatherResponse(data);

    } catch (error) {
      console.warn('Failed to fetch current weather:', error);
      return null;
    }
  }

  private static parseWeatherResponse(data: unknown): WeatherData[] {
    const weatherData = data as { daily?: { 
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      temperature_2m_mean?: number[];
      precipitation_sum?: number[];
      weather_code?: number[];
      wind_speed_10m_max?: number[];
    }};
    
    const daily = weatherData.daily;
    if (!daily) return [];
    
    const dates = daily.time || [];
    const tempMax = daily.temperature_2m_max || [];
    const tempMin = daily.temperature_2m_min || [];
    const tempMean = daily.temperature_2m_mean || [];
    const precipitation = daily.precipitation_sum || [];
    const weatherCodes = daily.weather_code || [];
    const windSpeed = daily.wind_speed_10m_max || [];

    return dates.map((date: string, index: number) => ({
      date,
      temperature: tempMean[index] || ((tempMax[index] + tempMin[index]) / 2) || 0,
      temperatureMax: tempMax[index] || 0,
      temperatureMin: tempMin[index] || 0,
      precipitation: precipitation[index] || 0,
      weatherCode: weatherCodes[index] || 0,
      weatherDescription: this.getWeatherDescription(weatherCodes[index] || 0),
      windSpeed: windSpeed[index] || 0
    }));
  }

  private static parseCurrentWeatherResponse(data: unknown): WeatherData {
    const weatherData = data as { 
      current?: { 
        temperature_2m?: number;
        relative_humidity_2m?: number;
        precipitation?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    };
    
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    const today = new Date().toISOString().split('T')[0];

    return {
      date: today,
      temperature: current.temperature_2m || 0,
      temperatureMax: daily.temperature_2m_max?.[0] || current.temperature_2m || 0,
      temperatureMin: daily.temperature_2m_min?.[0] || current.temperature_2m || 0,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation || 0,
      weatherCode: current.weather_code || 0,
      weatherDescription: this.getWeatherDescription(current.weather_code || 0),
      windSpeed: current.wind_speed_10m || 0
    };
  }

  /**
   * Convert WMO weather code to human readable description
   */
  private static getWeatherDescription(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    return weatherCodes[code] || 'Unknown';
  }

  
}
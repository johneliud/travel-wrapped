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


export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string; // 2-letter country code
  cca3: string; // 3-letter country code
  region: string;
  subregion?: string;
  capital?: string[];
  flag: string;
  flags: {
    svg: string;
    png: string;
  };
  timezones: string[];
  currencies?: Record<string, {
    name: string;
    symbol: string;
  }>;
  languages?: Record<string, string>;
}

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  region: string;
  capital?: string;
  timezone?: string;
}

export class CountriesService {
  private static readonly BASE_URL = 'https://restcountries.com/v3.1';
  private static readonly CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static cache = new Map<string, { data: Country[]; timestamp: number }>();
  private static countriesByCode = new Map<string, Country>();
  private static countriesByName = new Map<string, Country>();
  private static isInitialized = false;

  /**
   * Initialize the countries service by loading all countries
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const countries = await this.getAllCountries();
      
      // Build lookup maps
      countries.forEach(country => {
        // By code (case insensitive)
        this.countriesByCode.set(country.cca2.toLowerCase(), country);
        this.countriesByCode.set(country.cca3.toLowerCase(), country);
        
        // By name (case insensitive)
        this.countriesByName.set(country.name.common.toLowerCase(), country);
        this.countriesByName.set(country.name.official.toLowerCase(), country);
      });

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize countries service:', error);
    }
  }

  
}
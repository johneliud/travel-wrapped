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

  /**
   * Get country information by country code or name
   */
  static async getCountryInfo(identifier: string): Promise<CountryInfo | null> {
    await this.initialize();

    const normalizedId = identifier.toLowerCase().trim();
    
    // Try by code first
    let country = this.countriesByCode.get(normalizedId);
    
    // Try by name if not found
    if (!country) {
      country = this.countriesByName.get(normalizedId);
    }

    // Try partial name matching
    if (!country) {
      const entries = Array.from(this.countriesByName.entries());
      const match = entries.find(([name]) => 
        name.includes(normalizedId) || normalizedId.includes(name)
      );
      country = match?.[1];
    }

    if (!country) {
      return null;
    }

    return this.formatCountryInfo(country);
  }

  /**
   * Search countries by region
   */
  static async getCountriesByRegion(region: string): Promise<CountryInfo[]> {
    try {
      const cacheKey = `region:${region.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
        return cached.data.map(c => this.formatCountryInfo(c));
      }

      const url = `${this.BASE_URL}/region/${encodeURIComponent(region)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Countries API error: ${response.status}`);
      }

      const countries: Country[] = await response.json();
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: countries,
        timestamp: Date.now()
      });

      return countries.map(c => this.formatCountryInfo(c));

    } catch (error) {
      console.warn(`Failed to fetch countries in region ${region}:`, error);
      return [];
    }
  }

  /**
   * Get all countries (cached)
   */
  private static async getAllCountries(): Promise<Country[]> {
    const cacheKey = 'all-countries';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const url = `${this.BASE_URL}/all?fields=name,cca2,cca3,region,subregion,capital,flag,flags,timezones,currencies,languages`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Countries API error: ${response.status}`);
      }

      const countries: Country[] = await response.json();
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: countries,
        timestamp: Date.now()
      });

      return countries;

    } catch (error) {
      console.error('Failed to fetch all countries:', error);
      throw error;
    }
  }

  /**
   * Get country by coordinates (using most likely country based on location)
   */
  static async getCountryByCoordinates(lat: number, lon: number): Promise<CountryInfo | null> {
    // This is a simplified approach - in a real app you might use a reverse geocoding service
    // For now, we'll use some basic geographic rules for common regions
    
    // Africa
    if (lat >= -35 && lat <= 37 && lon >= -20 && lon <= 52) {
      if (lat >= -5 && lat <= 5 && lon >= 29 && lon <= 42) {
        // East Africa region - Kenya, Uganda, Tanzania area
        if (lon >= 34 && lon <= 41) return await this.getCountryInfo('kenya');
        if (lon >= 29 && lon <= 35) return await this.getCountryInfo('uganda');
        if (lat <= -1 && lon >= 29 && lon <= 40) return await this.getCountryInfo('tanzania');
      }
    }

    // This is a fallback - in production you'd use proper reverse geocoding
    return null;
  }

  private static formatCountryInfo(country: Country): CountryInfo {
    return {
      name: country.name.common,
      code: country.cca2,
      flag: country.flag,
      region: country.region,
      capital: country.capital?.[0],
      timezone: country.timezones?.[0]
    };
  }

  /**
   * Clear the countries cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.countriesByCode.clear();
    this.countriesByName.clear();
    this.isInitialized = false;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; initialized: boolean } {
    return {
      size: this.cache.size,
      initialized: this.isInitialized
    };
  }
}
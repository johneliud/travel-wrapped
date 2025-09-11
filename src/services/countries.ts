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
  flags?: {
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
  private static readonly RATE_LIMIT_MS = 1000; // 1 second between requests
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 2000;
  private static cache = new Map<string, { data: Country[]; timestamp: number }>();
  private static countriesByCode = new Map<string, Country>();
  private static countriesByName = new Map<string, Country>();
  private static isInitialized = false;
  private static lastRequestTime = 0;

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

    const url = `${this.BASE_URL}/all?fields=name,cca2,cca3,region,subregion,capital,flags,timezones,currencies,languages`;
    const countries = await this.fetchWithRetry(url);
    
    // Cache the results
    this.cache.set(cacheKey, {
      data: countries,
      timestamp: Date.now()
    });

    return countries;
  }

  /**
   * Fetch with retry logic
   */
  private static async fetchWithRetry(url: string): Promise<Country[]> {
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.enforceRateLimit();
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Countries API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format from countries API');
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Countries API attempt ${attempt} failed:`, error);

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => 
            setTimeout(resolve, this.RETRY_DELAY_MS * attempt)
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Get country by coordinates using Nominatim reverse geocoding
   */
  static async getCountryByCoordinates(lat: number, lon: number): Promise<CountryInfo | null> {
    try {
      // Implement rate limiting
      await this.enforceRateLimit();
      
      // Use Nominatim for reverse geocoding to get country
      const url = `https://nominatim.openstreetmap.org/reverse?` + new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lon.toString(),
        zoom: '3', // Country level
        addressdetails: '1'
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Travel-Wrapped/1.0 (Educational Project)'
        }
      });

      if (!response.ok) {
        console.warn(`Nominatim reverse geocoding failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.address && data.address.country) {
        // Get detailed country info from our REST Countries cache
        return await this.getCountryInfo(data.address.country);
      }

      return null;
    } catch (error) {
      console.warn('Reverse geocoding for country failed:', error);
      return null;
    }
  }

  private static formatCountryInfo(country: Country): CountryInfo {
    return {
      name: country.name.common,
      code: country.cca2,
      flag: this.getFlagEmoji(country.cca2),
      region: country.region,
      capital: country.capital?.[0],
      timezone: country.timezones?.[0]
    };
  }

  /**
   * Generate flag emoji from country code using regional indicator symbols
   */
  static getFlagEmoji(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => {
          const charCode = char.charCodeAt(0);
          if (charCode < 65 || charCode > 90) return 0x1F1E6; // Default to 'A'
          return 0x1F1E6 - 65 + charCode;
        });
      
      return String.fromCodePoint(...codePoints);
    } catch (error) {
      console.warn(`Failed to generate flag for ${countryCode}:`, error);
      return '🌍';
    }
  }

  /**
   * Get multiple countries by codes (batch operation)
   */
  static async getCountriesByCodes(codes: string[]): Promise<CountryInfo[]> {
    await this.initialize();
    
    const results: CountryInfo[] = [];
    for (const code of codes) {
      const info = await this.getCountryInfo(code);
      if (info) {
        results.push(info);
      }
    }
    
    return results;
  }

  private static async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
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
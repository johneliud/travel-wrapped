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


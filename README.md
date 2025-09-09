# Travel Wrapped

**Travel Wrapped** is a Spotify Wrapped inspired PWA that generates travel recaps from Google Maps Timeline data. Users can upload Google Maps Timeline data or manually enter trips to get personalized travel insights, beautiful visualizations, and shareable content.

## Features

### Privacy First
- **100% Frontend-only** - No backend servers, your data never leaves your device
- **Local Processing** - All timeline analysis happens in your browser
- **No Data Collection** - We don't store, track, or transmit your personal data

### Data Input System (MVP Phase 1.2) - Completed

#### Google Timeline Upload
- **Drag & Drop Interface** - Easy file upload with visual feedback
- **Progress Tracking** - Real-time progress indicators during processing
- **Format Validation** - Automatic validation of Google Timeline JSON format
- **Error Handling** - Comprehensive error reporting with recovery suggestions
- **Large File Support** - Handles Timeline files up to 50MB

#### Manual Trip Entry
- **Trip Form** - Add individual trips with city, country, dates, and notes
- **Multi-day Trips** - Support for trips spanning multiple days
- **Data Validation** - Form validation with helpful error messages
- **Trip Management** - Add, edit, and remove manual entries

#### Smart Processing
- **Timeline Parser** - Extracts visits and activities from Google Timeline data
- **Distance Calculation** - Calculates travel distances using Haversine formula
- **Statistics Engine** - Generates comprehensive travel statistics
- **Data Merging** - Combines Timeline data with manual entries

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johneliud/travel_wrapped.git
   cd travel_wrapped
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Visit** `http://localhost:5173` in your browser

### Getting Your Timeline Data

1. Go to [Google Takeout](https://takeout.google.com)
2. Select "Timeline" 
3. Choose JSON format and download
4. Extract the `Timeline.json` file from the downloaded archive
5. Upload it to Travel Wrapped

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Data Processing**: date-fns, Papaparse, Dexie.js
- **Build Tool**: Vite with Hot Module Replacement

### 🌐 **API Integrations** (All Free, No Keys Required)
- **[Nominatim](https://nominatim.org/)** - Geocoding and reverse geocoding (OpenStreetMap)
- **[Open-Meteo](https://open-meteo.com/)** - Historical weather data
- **[REST Countries](https://restcountries.com/)** - Country information and flags

## Project Structure

```
src/
├── components/
│   ├── DataInput/          # Main data input orchestration with enhanced processing toggle
│   ├── FileUpload/         # Timeline JSON file upload
│   ├── ManualEntry/        # Manual trip entry form
│   └── ProgressIndicator/  # Progress tracking components
├── services/
│   ├── parser.ts          # Google Timeline JSON parser with enhanced processing
│   ├── calculations.ts    # Advanced trip grouping and statistics engine
│   ├── geocoding.ts       # Nominatim API integration for location data
│   ├── countries.ts       # REST Countries API for country information
│   └── weather.ts         # Open-Meteo API for historical weather data
├── types/
│   └── travel.ts          # TypeScript interfaces (basic + enhanced)
├── utils/
│   ├── validation.ts      # Data validation utilities
│   └── errorHandling.ts   # Error handling and user messages
└── App.tsx               # Main application with results and visualization views
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Current Status

### Phase 1.2: Data Input System (Complete)
### Phase 1.3: Core Statistics Engine (Complete)

**Latest Features Added:**
- **Processing Mode Toggle** - Choose between basic or enhanced processing
- **Real Geocoding** - Actual city and country names via OpenStreetMap
- **Country Flags** - Proper flag emojis generated from country codes
- **Weather Integration** - Historical weather data for your travel dates
- **Enhanced Statistics** - Top destinations, visit counts, travel insights
- **Improved UI** - Beautiful gradients, better layouts, visualization placeholder

### Completed Phases
- [x] File upload component for Timeline.json
- [x] JSON parser for Google Timeline format  
- [x] Manual trip entry form (city, date, optional notes)
- [x] Data validation and error handling
- [x] Progress indicators for file processing

### Phase 1.3: Core Statistics Engine (Complete)
- [x] Extract trips from Timeline data with smart grouping (stays vs journeys)
- [x] Calculate total distance traveled using Haversine formula
- [x] Count unique cities and countries visited via real geocoding APIs
- [x] Find longest single trip with enhanced accuracy
- [x] Identify most visited location with proximity-based deduplication
- [x] Enhanced data structures for processed trips with API enrichment

#### Enhanced API Integration Features
- [x] **Nominatim Geocoding** - Real location names and addresses (OpenStreetMap)
- [x] **REST Countries API** - Country flags, capitals, and metadata
- [x] **Open-Meteo Weather** - Historical weather data for travel dates
- [x] **Rate limiting & Caching** - Respectful API usage with local storage
- [x] **Graceful fallbacks** - Works offline or when APIs are unavailable

### Coming Next: Phase 1.4 - Local Storage System
- [ ] Setup Dexie.js for IndexedDB
- [ ] Save/load processed trip data
- [ ] Data persistence between sessions
- [ ] Clear data functionality
- [ ] Storage quota monitoring

## Data Processing

The app offers two processing modes:

### **Basic Processing**
- **Visits**: Places you stayed (with location, duration, confidence)
- **Activities**: Movement between places (walking, driving, etc.)  
- **Timeline Paths**: GPS coordinate sequences
- **Statistics**: Distance, unique locations, travel patterns

### **Enhanced Processing** (NEW)
Everything from basic processing, plus:
- **Real location names** via Nominatim/OpenStreetMap geocoding
- **Country detection** with proper flag emojis and metadata
- **Weather insights** - hottest/coldest destinations during your trips
- **Smart trip grouping** - combines related segments into meaningful journeys
- **Proximity deduplication** - merges nearby visits to the same location
- **Rich statistics** - top destinations, visit counts, enhanced insights

**Privacy Note**: All processing happens locally in your browser. API calls are only made to enhance your data with publicly available information (location names, weather, country data). Your personal travel data never leaves your device.

## Contributing

This project follows privacy-first principles:
1. No external APIs that require authentication
2. No user data transmission
3. Frontend-only architecture
4. Free services only

## License

[MIT License](https://github.com/johneliud/travel_wrapped/blob/main/LICENSE)

---

**Privacy Notice**: Your travel data is processed entirely on your device. No information is sent to external servers or stored remotely.

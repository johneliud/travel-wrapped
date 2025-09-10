# Travel Wrapped

**Travel Wrapped** is a Spotify Wrapped inspired PWA that generates travel recaps from Google Maps Timeline data. Users can upload Google Maps Timeline data or manually enter trips to get personalized travel insights, beautiful visualizations, and shareable content.

## Features

### Privacy First
- **100% Frontend-only** - No backend servers, your data never leaves your device
- **Local Processing** - All timeline analysis happens in your browser
- **No Data Collection** - We don't store, track, or transmit your personal data

### Google Timeline Upload
- **Drag & Drop Interface** - Easy file upload with visual feedback
- **Progress Tracking** - Real-time progress indicators during processing
- **Format Validation** - Automatic validation of Google Timeline JSON format
- **Error Handling** - Comprehensive error reporting with recovery suggestions
- **Large File Support** - Handles Timeline files up to 50MB

### Manual Trip Entry
- **Trip Form** - Add individual trips with city, country, dates, and notes
- **Multi-day Trips** - Support for trips spanning multiple days
- **Data Validation** - Form validation with helpful error messages
- **Trip Management** - Add, edit, and remove manual entries

### Smart Processing
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
- **Local Storage**: IndexedDB via Dexie.js for data persistence
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
│   ├── storage.ts         # Dexie.js IndexedDB database and caching service
│   ├── geocoding.ts       # Nominatim API integration for location data
│   ├── countries.ts       # REST Countries API for country information
│   └── weather.ts         # Open-Meteo API for historical weather data
├── hooks/
│   ├── useTravelData.ts   # Travel data persistence and management
│   ├── useLocalStorage.ts # Generic local storage utilities
│   └── useStorageQuota.ts # Storage space monitoring
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
### Phase 1.4: Local Storage System (Complete)

**Latest Features Added:**
- **Data Persistence** - Travel data automatically saved between sessions
- **Storage Management** - IndexedDB-based storage with quota monitoring
- **Multiple Datasets** - Save and manage multiple travel datasets
- **Data Export/Import** - Backup and restore functionality
- **Storage Warnings** - Alerts when storage space is running low
- **Automatic Recovery** - Resumes from last session on page reload

### Coming Next: Phase 1.5 - Basic Visualization
- [ ] Setup React Leaflet map component
- [ ] Display trip locations as pins
- [ ] Simple polylines connecting locations
- [ ] Map controls (zoom, pan)
- [ ] Responsive map container

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

## Local Storage System

Travel Wrapped includes a robust local storage system that ensures your data is preserved between sessions:

### **Data Persistence**
- **Automatic Saving** - All processed travel data is automatically saved to IndexedDB
- **Session Recovery** - Resume exactly where you left off when you return to the app
- **Multiple Datasets** - Save and manage multiple travel datasets simultaneously
- **Manual Entry History** - Your manual trip entries are preserved

### **Storage Management**
- **Quota Monitoring** - Real-time tracking of storage usage with visual indicators
- **Storage Warnings** - Automatic alerts when storage space runs low (80% usage)
- **Critical Alerts** - Emergency warnings when storage is nearly full (95% usage)
- **Data Export** - Export all your data for backup purposes
- **Data Import** - Restore data from backups
- **Selective Deletion** - Remove specific datasets to free up space

### **Technical Details**
- **IndexedDB Backend** - Uses browser's native IndexedDB for optimal performance
- **Dexie.js Framework** - Reliable database operations with transaction safety
- **Compressed Storage** - Efficient data structures minimize storage footprint
- **Cache Integration** - API response caching reduces redundant network requests
- **Error Recovery** - Robust error handling with graceful degradation

The storage system is designed to handle large Timeline files (50MB+) while maintaining fast performance and reliability across all modern browsers.

## License

[MIT License](https://github.com/johneliud/travel_wrapped/blob/main/LICENSE)

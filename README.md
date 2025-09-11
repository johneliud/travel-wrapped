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
- **Animations**: Framer Motion for smooth transitions and storytelling
- **Mapping**: React Leaflet + OpenStreetMap tiles
- **Data Processing**: date-fns, Papaparse, Dexie.js
- **Local Storage**: IndexedDB via Dexie.js for data persistence
- **Build Tool**: Vite with Hot Module Replacement

### 🌐 **API Integrations** (All Free, No Keys Required)
- **[Nominatim](https://nominatim.org/)** - Geocoding and reverse geocoding (OpenStreetMap)
- **[Open-Meteo](https://open-meteo.com/)** - Historical weather data
- **[REST Countries](https://restcountries.com/)** - Country information and flags
- **[Numbers API](http://numbersapi.com/)** - Fun facts about numbers for gamification

## Project Structure

```
src/
├── components/
│   ├── DataInput/          # Main data input orchestration with enhanced processing toggle
│   ├── FileUpload/         # Timeline JSON file upload
│   ├── ManualEntry/        # Manual trip entry form
│   ├── MapView/            # Interactive map visualization with React Leaflet
│   ├── StatsCards/         # Gamified stats display with achievements and levels
│   ├── WrappedFlow/        # Spotify-style story flow with Framer Motion animations
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
│   ├── errorHandling.ts   # Error handling and user messages
│   └── gamification.ts    # Achievement system, travel levels, and Numbers API integration
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

### Phase 1.2: Data Input System ✅ Complete
### Phase 1.3: Core Statistics Engine ✅ Complete  
### Phase 1.4: Local Storage System ✅ Complete
### Phase 1.5: Basic Visualization ✅ Complete
### Phase 1.6: Stats Display ✅ Complete
### Phase 2.1: Wrapped Flow Animation ✅ Complete

**Latest Features Added (Phase 2.1):**
- **Spotify-Style Storytelling** - Animated story flow that reveals travel insights dramatically
- **Framer Motion Integration** - Smooth, professional animations with spring physics
- **Auto-Advance Slides** - Timed progression through your travel story with manual controls
- **Interactive Progress Bar** - Visual progress indicator with clickable slide navigation
- **Dynamic Story Generation** - Slides adapt based on your data (achievements, weather, etc.)
- **Cinematic Reveals** - Smooth fade-ins, scale animations, and staggered content reveals
- **Mobile-Optimized Controls** - Touch-friendly navigation with hover states for desktop

**Previous Features (Phase 1.6):**
- **Gamified Stats Cards** - Beautiful, interactive stat displays with hover effects
- **Achievement System** - 20+ unlockable achievements based on travel behavior
- **Travel Levels** - Progressive level system from "Local Explorer" to "Legendary Nomad"
- **Travel Personality** - Dynamic personality types like "Globe Trotter" and "Weather Warrior"
- **Numbers API Integration** - Fun facts about your travel numbers in real-time
- **Distance Equivalents** - Compare your distance to Earth's circumference and other fun metrics
- **Progressive UI** - Animated progress bars, unlock celebrations, and visual feedback

**Previous Features:**
- **Interactive Maps** - React Leaflet integration with OpenStreetMap tiles
- **Location Markers** - Clickable pins showing trip details and weather data
- **Route Visualization** - Polylines connecting travel destinations
- **Map Controls** - Zoom, pan, and auto-fit to show all locations
- **Enhanced Popups** - Rich location information with place names and visit counts
- **Responsive Design** - Mobile-optimized map interface
- **Data Persistence** - Travel data automatically saved between sessions
- **Storage Management** - IndexedDB-based storage with quota monitoring
- **Multiple Datasets** - Save and manage multiple travel datasets
- **Data Export/Import** - Backup and restore functionality
- **Storage Warnings** - Alerts when storage space is running low
- **Automatic Recovery** - Resumes from last session on page reload

### Coming Next: Phase 2.2 - Free API Integration  
- [ ] Integrate Nominatim geocoding for manual entries
- [ ] Add Open-Meteo weather data for trips
- [ ] REST Countries API for country flags/info
- [ ] Graceful error handling for API failures
- [ ] Caching API responses locally

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

## Interactive Visualization

Travel Wrapped now includes rich interactive visualization of your travel data:

### **Interactive Maps**
- **React Leaflet Integration** - Fast, responsive maps powered by OpenStreetMap
- **Location Markers** - Each unique location shows as a clickable pin
- **Smart Grouping** - Multiple trips to the same location are grouped together
- **Auto-Fit Bounds** - Map automatically zooms to show all your travel locations

### **Rich Information Popups**
- **Location Details** - Coordinates, place names, and country information
- **Trip Summaries** - Visit dates, duration, and trip counts
- **Weather Data** - Temperature and conditions for enhanced trips
- **Visit History** - Shows multiple visits to the same location

### **Route Visualization** 
- **Connected Routes** - Polylines show your travel paths between destinations
- **Visual Journey** - See the flow of your travels across the map
- **Distance Insights** - Visual representation of travel distances

### **Enhanced Data Display**
When using enhanced processing, maps show additional information:
- **Weather Integration** - Temperature and weather icons in popups
- **Location Names** - Real place names from geocoding APIs
- **Country Information** - Country detection and proper formatting
- **Smart Statistics** - Enhanced insights displayed alongside the map

## Gamification & Engagement

Travel Wrapped transforms your travel data into an engaging, game-like experience:

### **Achievement System** 
- **20+ Unique Achievements** - From "First Steps" to "Globe Trotter" and "Space Bound"
- **Multiple Categories** - Distance, countries, cities, trips, and special weather achievements
- **Visual Progress** - Locked/unlocked states with meaningful icons and descriptions
- **Smart Unlocking** - Achievements unlock automatically based on your travel patterns

### **Travel Level System**
- **10 Progressive Levels** - From "Stay-at-Home" (Level 1) to "Legendary Nomad" (Level 10)
- **Distance-Based Progression** - Level up by traveling more kilometers
- **Visual Progress Bar** - See exactly how close you are to the next level
- **Meaningful Milestones** - Each level represents significant travel achievements

### **Dynamic Travel Personality**
- **6+ Personality Types** - Algorithm determines your travel style
- **Adaptive Descriptions** - "Weather Warrior", "City Collector", "Border Hopper", etc.
- **Based on Real Behavior** - Calculated from actual travel patterns and preferences
- **Enhanced Integration** - Special personalities unlock with weather data

### **Numbers API Integration**
- **Real-Time Fun Facts** - Interesting trivia about your travel numbers
- **Multiple Fact Types** - Math facts, historical events, and random trivia
- **Smart Caching** - Facts cached locally to reduce API calls and improve performance
- **Contextual Display** - Facts relevant to distance, countries, cities, and trip counts

### **Interactive Statistics**
- **Distance Comparisons** - "You've traveled X% around Earth's circumference!"
- **Hover Effects** - Interactive cards with smooth animations
- **Progress Visualization** - Animated progress bars and level indicators
- **Color-Coded Categories** - Visual hierarchy for different stat types

## Wrapped Story Experience

Inspired by Spotify Wrapped, Travel Wrapped creates a cinematic storytelling experience that transforms your travel data into an engaging narrative:

### **Story-Style Slide Navigation**
- **Dynamic Slide Generation** - Stories adapt based on your travel data
- **Cinematic Timing** - Each slide has carefully tuned auto-advance delays
- **Smooth Transitions** - Framer Motion powers professional slide transitions
- **Manual Controls** - Skip, pause, or navigate freely through your story

### **Animated Reveals**
- **Staggered Content** - Statistics and achievements reveal with perfect timing
- **Spring Physics** - Natural, bouncy animations for key moments
- **Scale & Fade Effects** - Dramatic reveals for important numbers
- **3D Transforms** - Subtle rotation and perspective effects

### **Interactive Controls**
- **Progress Visualization** - Real-time progress bar across the top
- **Slide Navigation** - Click any dot to jump to specific moments
- **Play/Pause Toggle** - Control auto-advance timing
- **Mobile Optimized** - Touch-friendly controls with hover states

### **Adaptive Storytelling**
Your story changes based on what you've achieved:
- **Achievement Celebrations** - Special slides for unlocked achievements
- **Weather Adventures** - Enhanced slides showing hot/cold experiences
- **Personality Reveals** - Dynamic personality assignment with custom descriptions
- **Level Progression** - Visual celebration of your travel level advancement

### **Immersive Design**
- **Full-Screen Experience** - Takes over the entire viewport
- **Gradient Backgrounds** - Subtle, beautiful color transitions
- **Responsive Typography** - Text scales perfectly across all devices
- **Backdrop Blur Effects** - Modern glass-morphism design elements

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

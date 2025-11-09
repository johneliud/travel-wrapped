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

### Enhanced Manual Trip Entry
- **Smart Location Lookup** - Real-time geocoding suggestions as you type city names
- **Automatic Country Detection** - Countries auto-populate based on geocoding results
- **Debounced Search** - Intelligent 500ms delay prevents excessive API calls
- **Location Confidence** - Visual confidence indicators for geocoding matches
- **Multi-day Trip Support** - Flexible date ranges for extended trips
- **Enhanced Validation** - Comprehensive form validation with helpful error messages
- **Coordinates Storage** - Precise location data for enhanced map visualization

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
- **Styling**: Tailwind CSS + Custom CSS with backdrop filters and animations
- **Animations**: Framer Motion for smooth transitions and storytelling
- **Mapping**: React Leaflet + Stadia Maps tile servers (5 beautiful styles)
- **Data Processing**: date-fns, Papaparse, Dexie.js
- **Local Storage**: IndexedDB via Dexie.js for data persistence
- **Build Tool**: Vite with Hot Module Replacement

### 🌐 **Enhanced API Integrations** (All Free, No Keys Required)
- **[Nominatim](https://nominatim.org/)** - Geocoding and reverse geocoding with intelligent suggestions
- **[Open-Meteo](https://open-meteo.com/)** - Historical weather data with retry logic and fallbacks
- **[REST Countries](https://restcountries.com/)** - Country information, flag generation, and batch operations
- **[Numbers API](http://numbersapi.com/)** - Fun facts about numbers for gamification

#### **Advanced API Features:**
- **Circuit Breaker Pattern** - Automatic failure detection and recovery for API services
- **Multi-Level Caching** - Memory + persistent storage for optimal performance and offline capability
- **Intelligent Fallbacks** - Graceful degradation when services are unavailable
- **Rate Limiting** - Respects API limits with exponential backoff retry strategies
- **Error Recovery** - Comprehensive error handling with user-friendly messages

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
- **Multi-Style Map Support** - 5 beautiful tile layer options: Bright, Outdoors, Dark, Watercolor, and Terrain
- **Custom Markers** - Weather icons with temperature display and country flag markers
- **Smart Location Grouping** - Multiple trips to the same location are intelligently grouped together
- **Auto-Fit Bounds** - Map automatically zooms to show all your travel locations
- **Enhanced Route Visualization** - Animated polylines with gradient colors and dash patterns

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
- **Weather Icon Markers** - Custom markers with weather conditions and temperature display
- **Country Flag Markers** - Beautiful flag-based markers using Unicode flag emojis
- **Location Names** - Real place names from geocoding APIs with enhanced popups
- **Map Style Selector** - Choose from 5 beautiful tile layers (Bright, Outdoors, Dark, Watercolor, Terrain)
- **Visual Statistics Panel** - Trip and location counts displayed with icons in the bottom corner

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

## Advanced Travel Analytics

Travel Wrapped now includes sophisticated analytics that provide deeper insights into your travel patterns and behavior:

### **Travel Pattern Analysis**
- **Busiest Month Detection** - Automatically identifies your most active travel month based on trip frequency and total distance
- **Seasonal Travel Preferences** - Analyzes your travel activity across Spring, Summer, Autumn, and Winter with detailed breakdowns
- **Activity Metrics** - Combines trip counts with distance traveled for comprehensive activity assessment

### **Travel Streak Analysis**
- **Consecutive Travel Detection** - Identifies your longest travel streak with intelligent gap tolerance (7-day default)
- **Streak Metrics** - Tracks total days, trip count, countries visited, and distance covered during streaks
- **Travel Momentum** - Helps you understand your sustained travel periods and travel intensity

### **Global Mobility Insights**
- **Timezone Crossing Tracker** - Monitors your movement across different time zones using longitude-based calculations
- **Transition History** - Records detailed timezone transitions with locations and dates
- **World Coverage** - Approximates your global travel reach through timezone analysis

### **Transport Mode Intelligence**
- **Automatic Categorization** - Smart classification of travel modes based on distance and Google Timeline activity types:
  - **Flying**: Long-distance travel (>500km) or flights detected in Timeline data
  - **Driving**: Medium-distance travel (20-500km) or car/bus activities
  - **Walking**: Short-distance travel (<20km) or walking activities
- **Distance Distribution** - Percentage breakdown of how you travel with detailed statistics
- **Mode Analytics** - Trip counts, average distances, and travel preferences per transport type

### **Smart Data Processing**
- **Timeline Activity Analysis** - Leverages Google Timeline's activity classifications (DRIVING, WALKING, IN_PLANE, etc.)
- **Distance-Based Logic** - Uses travel distance as a secondary factor for transport mode detection
- **Confidence Scoring** - Prioritizes higher-confidence data from Google's location services
- **Fallback Mechanisms** - Graceful handling when specific activity data is unavailable

### **Statistical Accuracy**
- **7-Day Gap Tolerance** - Travel streaks allow up to 7 days between trips for realistic streak calculation
- **15-Degree Timezone Approximation** - Uses longitude-based timezone estimation for crossing detection
- **Proximity Deduplication** - Merges nearby location visits (0.5km threshold) for cleaner analytics
- **Seasonal Definitions** - Standard meteorological seasons (Spring: Mar-May, Summer: Jun-Aug, etc.)

## API Integration Architecture

Travel Wrapped implements a sophisticated API integration system designed for reliability, performance, and privacy:

### **Intelligent Geocoding System**
- **Debounced Input** - Real-time search with 500ms delay to prevent API spam
- **Location Suggestions** - Interactive dropdown with confidence scores and country info
- **Click-Outside Handling** - Intuitive UX with proper focus management
- **Persistent Caching** - Geocoding results cached for 24 hours in IndexedDB
- **Fallback Coordinates** - Graceful handling when location lookup fails

### **Weather Data Integration**
- **Historical Weather API** - Fetches actual weather conditions for your travel dates
- **Temperature Extremes** - Automatically identifies your hottest and coldest trips
- **Weather Statistics** - Aggregate insights across all your travels
- **Smart Caching** - Weather data cached for 24 hours (historical data doesn't change)
- **Batch Processing** - Efficient handling of multiple weather requests

### **Country Information System**
- **Flag Emoji Generation** - Converts country codes to proper flag emojis using Unicode
- **Batch Operations** - Efficiently processes multiple countries simultaneously
- **Region Detection** - Automatic geographic region classification
- **Enhanced Statistics** - Country visit counts with proper flag display
- **Coordinate-Based Lookup** - Reverse geocoding to determine countries from GPS data

### **Reliability & Performance**
- **Circuit Breaker Pattern** - Prevents cascading failures when APIs are down
- **Exponential Backoff** - Intelligent retry logic respects API rate limits
- **Multi-Level Caching** - Memory + persistent storage for optimal performance
- **Graceful Degradation** - App continues working even when APIs fail
- **Error Boundaries** - Comprehensive error handling with user-friendly messages
- **Privacy-First** - All API calls enhance your data without transmitting personal information

## License

[MIT License](https://github.com/johneliud/travel_wrapped/blob/main/LICENSE)

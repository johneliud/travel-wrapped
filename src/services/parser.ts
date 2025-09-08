import { parseISO } from 'date-fns';
import type { 
  GoogleTimelineData, 
  SemanticSegment, 
  ProcessedTrip, 
  LatLng, 
  ProcessingResult,
  TravelStats 
} from '../types/travel';

export class TimelineParser {
  private static parseLatLngString(latLngStr: string): LatLng {
    // Parse format like "-0.065945°, 34.7739183°"
    const [latStr, lngStr] = latLngStr.replace(/°/g, '').split(', ');
    return {
      latitude: parseFloat(latStr),
      longitude: parseFloat(lngStr)
    };
  }

  
}
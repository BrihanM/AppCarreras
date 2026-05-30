import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface OsrmRouteResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: unknown;
  }>;
}

interface NominatimReverseResponse {
  display_name?: string;
}

interface NominatimSearchResponseItem {
  lat: string;
  lon: string;
  display_name?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface RouteResult {
  provider: string;
  distanceKm: number;
  durationMin: number;
  geometry: unknown;
}

@Injectable({ providedIn: 'root' })
export class RouteMapService {
  private readonly osrmBaseUrl = 'https://router.project-osrm.org';
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private readonly http: HttpClient) {}

  getRoute(originLat: number, originLng: number, destinationLat: number, destinationLng: number): Observable<RouteResult> {
    const url = `${this.osrmBaseUrl}/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson&steps=false`;
    return this.http.get<OsrmRouteResponse>(url).pipe(
      map((res) => {
        const first = res?.routes?.[0];
        if (!first) {
          throw new Error('No route found');
        }
        return {
          provider: 'osrm',
          distanceKm: Number((first.distance / 1000).toFixed(2)),
          durationMin: Number((first.duration / 60).toFixed(1)),
          geometry: first.geometry,
        } as RouteResult;
      })
    );
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    const url = `${this.nominatimBaseUrl}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    return this.http.get<NominatimReverseResponse>(url).pipe(
      map((res) => (res?.display_name || '').trim())
    );
  }

  geocode(query: string): Observable<GeocodeResult> {
    const encoded = encodeURIComponent(query.trim());
    const url = `${this.nominatimBaseUrl}/search?format=jsonv2&limit=1&q=${encoded}`;

    return this.http.get<NominatimSearchResponseItem[]>(url).pipe(
      map((res) => {
        const item = res?.[0];
        if (!item) {
          throw new Error('Location not found');
        }

        return {
          lat: Number(item.lat),
          lng: Number(item.lon),
          displayName: (item.display_name || query).trim(),
        } as GeocodeResult;
      })
    );
  }

  buildDirectionsUrl(originLat: number, originLng: number, destinationLat: number, destinationLng: number): string {
    const origin = `${originLat},${originLng}`;
    const destination = `${destinationLat},${destinationLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }
}

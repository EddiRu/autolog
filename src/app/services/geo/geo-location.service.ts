import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationService {

  private apiUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  getCoordinates(address: string) {
    const formattedAddress = encodeURIComponent(address);
    const url = `${this.apiUrl}?q=${formattedAddress}&format=json`;

    return this.http.get<any[]>(url);
  }
}

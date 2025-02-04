import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationService {

  private apiKey = 'pk.bdbdc4ac188dd13c192fc1cec4279b13';
  private map: any;

  constructor(private http: HttpClient) { }

  inicializarMapa(mapContainerId: string) {
    setTimeout(() => {
      if (this.map) {
        this.map.remove(); // 🔹 Eliminamos el mapa si ya existe para evitar errores
      }

      this.map = L.map(mapContainerId, {
        center: [22.768056, -102.533056], // 🔹 Zacatecas como centro
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // 🔹 Esperamos un poco antes de forzar el redibujado
      setTimeout(() => {
        this.map.invalidateSize(); // 🔥 Forzamos que Leaflet re-renderice los tiles
      }, 1000);
    }, 500);
  }






  // Obtiene coordenadas de una dirección usando LocationIQ
  private async obtenerCoordenadas(direccion: string): Promise<{ lat: number; lon: number } | null> {
    const direccionCompleta = `${direccion}, Zacatecas, México`;
    const url = `https://us1.locationiq.com/v1/search.php?key=${this.apiKey}&q=${encodeURIComponent(direccionCompleta)}&countrycodes=MX&format=json`;

    // 🔹 Esperar 1 segundo antes de hacer la petición para evitar bloqueo
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.http.get(url).toPromise()
      .then((data: any) => {
        if (data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
      })
      .catch((error) => {
        console.error('Error obteniendo coordenadas:', error);
        return null;
      });
}


  // Crea marcadores a partir de un array de direcciones
  async agregarMarcadores(direcciones: string[]): Promise<L.Layer[]> {
    const capas: L.Layer[] = [];

    for (const dir of direcciones) {
      const coordenadas = await this.obtenerCoordenadas(dir);
      if (coordenadas) {
        const marcador = L.marker([coordenadas.lat, coordenadas.lon], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
            iconSize: [25, 41],      // tamaño del ícono
            iconAnchor: [12, 41],    // punto del ícono que se ancla al mapa
            popupAnchor: [1, -34]    // posición del popup relativo al ícono
          }),
        }).bindPopup(`<b>Venta</b><br>${dir}`);

        capas.push(marcador);
      }
    }

    return capas; // Devolvemos el array de marcadores listo para usarse en [leafletLayers]
  }



}

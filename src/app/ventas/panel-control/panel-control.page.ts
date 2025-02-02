import { Component, OnInit } from '@angular/core';
import { VentasBuenasService } from 'src/app/services/admVentas/diarias/ventasBuenas/ventas-buenas.service';
import { VentasMalasService } from 'src/app/services/admVentas/diarias/ventasMalas/ventas-malas.service';
@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.page.html',
  styleUrls: ['./panel-control.page.scss'],
})
export class PanelControlPage implements OnInit {

  // Variables principales
  public ventasRegistros: any = []
  public ventasSospechosas: any = []

  constructor(
    private ventasBuenasService: VentasBuenasService,
    private ventasSospechosService: VentasMalasService
  ) { }

  ngOnInit() {
    this.getInfo();
  }

  async getInfo() {
    const hoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

    // Eliminar ventas viejas antes de cargar datos
    await this.eliminarRegistrosViejos(this.ventasBuenasService, hoy);
    await this.eliminarRegistrosViejos(this.ventasSospechosService, hoy);

    // Obtener solo las ventas actuales
    this.ventasBuenasService.getVentas().subscribe({
      next: (data) => this.ventasRegistros = data,
      error: (error) => console.error("Error al obtener las ventas buenas:", error),
    });

    this.ventasSospechosService.getVentas().subscribe({
      next: (data) => this.ventasSospechosas = data,
      error: (error) => console.error("Error al obtener las ventas sospechosas:", error),
    });
  }

  async eliminarRegistrosViejos(servicio: any, fechaHoy: string) {
    servicio.getVentas().subscribe({
      next: async (ventas) => {
        for (const v of ventas) {
          if (!v.FECHA_VENTA) continue;

          let fechaTexto = this.obtenerFechaTexto(v.FECHA_VENTA);
          if (fechaTexto !== fechaHoy) {
            try {
              await servicio.deleteVenta(v.id);
              console.log(`Registro eliminado: ${v.id}`);
            } catch (error) {
              console.error(`Error al eliminar el registro ${v.id}:`, error);
            }
          }
        }
      },
      error: (error) => console.error(`Error al obtener ventas para eliminar:`, error),
    });
  }

  obtenerFechaTexto(fecha: any): string {
    if (!fecha) return "";
    try {
      if (typeof fecha === "string") {
        return fecha.split(',')[0].trim();
      } else if (fecha.toDate) {
        return fecha.toDate().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      }
    } catch (error) {
      console.error("Error al procesar fecha:", fecha, error);
    }
    return "";
  }






}

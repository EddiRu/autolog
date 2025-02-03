import { Component, OnInit, OnDestroy } from '@angular/core';
import { VentasBuenasService } from 'src/app/services/admVentas/diarias/ventasBuenas/ventas-buenas.service';
import { VentasMalasService } from 'src/app/services/admVentas/diarias/ventasMalas/ventas-malas.service';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexAxisChartSeries
} from "ng-apexcharts";


@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.page.html',
  styleUrls: ['./panel-control.page.scss'],
})
export class PanelControlPage implements OnInit, OnDestroy {

  // Variables principales
  public ventasRegistros: any = []
  public ventasSospechosas: any = []

  // Variables para la fecha
  fechaHoraActual: string = ""; // Variable para mostrar la fecha y hora
  private intervalo: any; // Variable para almacenar el intervalo

  // Graficos
  public chartMejoresProveedores: Partial<{ series: ApexNonAxisChartSeries, chart: ApexChart, labels: string[] }> = { series: [], labels: [] };
  public chartVentasDia: Partial<{ 
    series: ApexAxisChartSeries, 
    chart: ApexChart, 
    xaxis: ApexXAxis,
    stroke: ApexStroke,
    dataLabels: ApexDataLabels
  }> = { series: [], xaxis: { categories: [] } };



  constructor(
    private ventasBuenasService: VentasBuenasService,
    private ventasSospechosService: VentasMalasService
  ) { }

  ngOnInit() {
    this.actualizarReloj(); // Llamar a la función cuando inicia el componente
    this.intervalo = setInterval(() => this.actualizarReloj(), 1000); // Actualiza cada segundo
    this.getInfo();
  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo); // Limpia el intervalo al salir de la página
    }
  }

  actualizarReloj() {
    const ahora = new Date();
    const formato = ahora.toLocaleString("es-MX", {
      weekday: "long", // Día de la semana (ejemplo: "miércoles")
      year: "numeric",
      month: "long", // Nombre completo del mes (ejemplo: "febrero")
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Formato de 12 horas
      timeZone: "America/Mexico_City", // Asegura la zona horaria correcta
    });

    this.fechaHoraActual = this.capitalizarTexto(formato);
  }

  // Función para capitalizar la primera letra de cada palabra
  capitalizarTexto(texto: string): string {
    return texto.replace(/\b\w/g, (letra) => letra.toUpperCase());
  }

  async getInfo() {
    const hoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

    // Eliminar ventas viejas antes de cargar datos
    await this.eliminarRegistrosViejos(this.ventasBuenasService, hoy);
    await this.eliminarRegistrosViejos(this.ventasSospechosService, hoy);

    // Obtener solo las ventas actuales
    this.ventasBuenasService.getVentas().subscribe({
      next: (data) => {
        this.ventasRegistros = data
        this.generarGraficoProveedores();
        this.generarGraficoVentasDia();
        console.log(data)
      },
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


  generarGraficoProveedores() {
    // Agrupar las ventas por proveedor
    const ventasPorProveedor = this.ventasRegistros.reduce((acc, venta) => {
      const proveedor = venta.ID_VENDEDOR;
      acc[proveedor] = (acc[proveedor] || 0) + 1;
      return acc;
    }, {});

    // Ordenar por mayor número de ventas
    const topProveedores = Object.entries(ventasPorProveedor)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5); // Tomamos solo los top 5 proveedores con más ventas

    // Configurar el gráfico Pie
    this.chartMejoresProveedores = {
      series: topProveedores.map((item: any) => item[1]), // Número de ventas por proveedor
      chart: { 
        type: "pie", 
        height: 350, // Ajustamos la altura
        width: "100%" // Aseguramos que use el ancho del contenedor
      },
      labels: topProveedores.map((item: any) => item[0]), // Nombre del proveedor
    };
    
  }

  generarGraficoVentasDia() {
    // Definimos los intervalos de 5 horas
    const intervalos = [
      "00:00 - 04:59",
      "05:00 - 09:59",
      "10:00 - 14:59",
      "15:00 - 19:59",
      "20:00 - 23:59"
    ];

    // Creamos un array con 5 posiciones para almacenar las ventas por cada intervalo
    let ventasPorIntervalo = new Array(5).fill(0);

    // Recorrer las ventas y clasificarlas en su intervalo correspondiente
    this.ventasRegistros.forEach(venta => {
      const fechaVenta = new Date(venta.FECHA_VENTA.seconds * 1000); // Convertir segundos a milisegundos
      const hora = fechaVenta.getHours(); // Obtener la hora de la venta

      // Determinar en qué intervalo de 5 horas cae la venta
      if (hora < 5) ventasPorIntervalo[0] += 1;
      else if (hora < 10) ventasPorIntervalo[1] += 1;
      else if (hora < 15) ventasPorIntervalo[2] += 1;
      else if (hora < 20) ventasPorIntervalo[3] += 1;
      else ventasPorIntervalo[4] += 1;
    });

    // Configurar el gráfico de líneas con intervalos de 5 horas
    this.chartVentasDia = {
      series: [
        {
          name: "Ventas",
          data: ventasPorIntervalo
        }
      ],
      chart: {
        type: "line",
        height: 180, // 🔹 Ajuste de altura para que coincida con el Pie Chart
        width: "150%" // 🔹 Se ajusta automáticamente al ancho del contenedor
      },
      stroke: {
        curve: "smooth"
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: intervalos // 🔹 Se mantienen los intervalos de 5 horas
      }
    };
    
  }



}

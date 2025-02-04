import { Component, OnInit } from '@angular/core';
import { VentasService } from 'src/app/services/admVentas/ventas/ventas.service';
import { IncidentesService } from 'src/app/services/admVentas/incidentes/incidentes.service';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexTitleSubtitle,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexAxisChartSeries
} from "ng-apexcharts";


export type ChartOptions = {
  series: ApexNonAxisChartSeries | ApexAxisChartSeries;
  chart: ApexChart;
  labels?: any;
  responsive?: ApexResponsive[];
  dataLabels?: ApexDataLabels;
  legend?: ApexLegend;
  title?: ApexTitleSubtitle;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis;
  stroke?: ApexStroke;
};

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {
  public periodoSeleccionado: string = 'primer';
  public busquedaProveedor: string = '';
  public ventasFiltradas: any[] = [];
  public incidentesFiltrados: any[] = [];


  public chartMejoresProveedores: Partial<ChartOptions> = {
    series: [],
    chart: { type: "pie", height: 300, width: "580%" },
    labels: [],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    title: { text: "Mejor Proveedor (Más Ventas)", align: "center" }
  };

  public chartIncidentesProveedores: Partial<ChartOptions> = {
    series: [],
    chart: { type: "pie", height: 600, width: "155%" },
    labels: [],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    title: { text: "Proveedor con más incidentes", align: "center" }
  };

  public chartTiposIncidentes: Partial<ChartOptions> = {
    series: [],
    chart: { type: "bar", height: 600, width: "100%" },
    title: { text: "Número de Incidentes por Tipo", align: "center" },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1 }
  };

  public chartActividadVentas: Partial<ChartOptions>;
  public chartActividadIncidentes: Partial<ChartOptions>;


  ventas: any[] = [];
  ventasOriginales: any[] = [];
  incidentes: any[] = [];
  incidentesOriginales: any[] = [];

  // Paginación
  public paginaActualIncidentes: number = 1;
  public incidentesPorPagina: number = 5;
  public incidentesPaginados: any[] = [];

  public paginaActualVentas: number = 1;
  public ventasPorPagina: number = 5;
  public ventasPaginadas: any[] = [];

  constructor(
    private ventasService: VentasService,
    private incidentesService: IncidentesService,
  ) { }

  ngOnInit() {
    this.getVentas();
    this.getIncidentes();
  }

  async getVentas() {
    this.ventasService.getVentas().subscribe({
      next: (data) => {
        this.ventas = data.filter(venta => this.filtrarPorPeriodo(venta.FECHA_VENTA)).map(venta => ({
          ...venta,
          FECHA_VENTA: this.formatTimestamp(venta.FECHA_VENTA)
        }));
        this.filtrarPorProveedor();
        this.generarGraficoProveedores();
        this.generarGraficoActividadVentas();
      },
      error: (error) => {
        console.error('Error al obtener las ventas:', error);
      }
    });
  }

  async getIncidentes(){
    this.incidentesService.getVentas().subscribe({
      next: (data) => {
        this.incidentes = data.filter(incidente => this.filtrarPorPeriodo(incidente.FECHA_VENTA)).map(incidente => ({
          ...incidente,
          FECHA_VENTA: this.formatTimestamp(incidente.FECHA_VENTA),
          tipoIncidente: this.determinarTipoIncidente(incidente)
        }));
        this.filtrarPorProveedor();
        this.generarGraficoIncidentes();
        this.generarGraficoTiposIncidentes();
        this.generarGraficoActividadIncidentes();
      },
      error: (error) => {
        console.error('Error al obtener los incidentes:', error);
      }
    })
  }

  determinarTipoIncidente(incidente: any): string {
    if (!incidente.ID_CILINDRO) return "Falta ID de Cilindro";
    if (!incidente.ID_VENDEDOR) return "Falta ID de Vendedor";
    if (!incidente.DOMICILIO) return "Domicilio vacío";
    return "Datos incompletos";
  }

  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return 'Fecha no disponible';
  }

  filtrarPorProveedor() {
    if (!this.busquedaProveedor.trim()) {
      this.ventasFiltradas = [...this.ventas];
      this.incidentesFiltrados = [...this.incidentes];
    } else {
      const filtro = this.busquedaProveedor.toLowerCase();
      this.ventasFiltradas = this.ventas.filter(venta =>
        venta.ID_VENDEDOR.toLowerCase().includes(filtro) ||
        venta.NOMBRE_VENDEDOR?.toLowerCase().includes(filtro)
      );
      
      this.incidentesFiltrados = this.incidentes.filter(incidente =>
        incidente.ID_VENDEDOR.toLowerCase().includes(filtro) ||
        incidente.NOMBRE_VENDEDOR?.toLowerCase().includes(filtro)
      );
    }
    
    this.actualizarPaginacionVentas();
    this.actualizarPaginacionIncidentes();
  }


  parsearFecha(fechaStr: any): Date {
    if (!fechaStr || typeof fechaStr !== 'string') return new Date();
    
    const meses = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    const regex = /(\d+) de (\w+) de (\d+),/;
    const match = fechaStr.match(regex);
    if (match) {
      const dia = parseInt(match[1], 10);
      const mes = meses[match[2].toLowerCase()];
      const anio = parseInt(match[3], 10);
      return new Date(anio, mes, dia);
    }
    return new Date(); // Retorna la fecha actual si no puede parsear
  }

  filtrarPorPeriodo(fechaStr: any): boolean {
    const fecha = new Date(fechaStr.seconds * 1000); // Convertir Timestamp
    const mes = fecha.getMonth() + 1; // Meses en JavaScript van de 0 a 11
    if (this.periodoSeleccionado === 'primer') {
      return mes >= 1 && mes <= 6;
    } else {
      return mes >= 7 && mes <= 12;
    }
  }

  actualizarPaginacionIncidentes() {
    const inicio = (this.paginaActualIncidentes - 1) * this.incidentesPorPagina;
    const fin = inicio + this.incidentesPorPagina;
    this.incidentesPaginados = this.incidentesFiltrados.slice(inicio, fin);
  }

  actualizarPaginacionVentas() {
    const inicio = (this.paginaActualVentas - 1) * this.ventasPorPagina;
    const fin = inicio + this.ventasPorPagina;
    this.ventasPaginadas = this.ventasFiltradas.slice(inicio, fin);
  }

  paginaAnteriorIncidentes() {
    if (this.paginaActualIncidentes > 1) {
      this.paginaActualIncidentes--;
      this.actualizarPaginacionIncidentes();
    }
  }

  paginaSiguienteIncidentes() {
    if (this.paginaActualIncidentes < this.getTotalPaginasIncidentes()) {
      this.paginaActualIncidentes++;
      this.actualizarPaginacionIncidentes();
    }
  }

  paginaAnteriorVentas() {
    if (this.paginaActualVentas > 1) {
      this.paginaActualVentas--;
      this.actualizarPaginacionVentas();
    }
  }

  paginaSiguienteVentas() {
    if (this.paginaActualVentas < this.getTotalPaginasVentas()) {
      this.paginaActualVentas++;
      this.actualizarPaginacionVentas();
    }
  }

  getTotalPaginasIncidentes(): number {
    return Math.ceil(this.incidentesFiltrados.length / this.incidentesPorPagina);
  }

  getTotalPaginasVentas(): number {
    return Math.ceil(this.ventasFiltradas.length / this.ventasPorPagina);
  }


  cambiarPeriodo(periodo: string) {
    this.periodoSeleccionado = periodo;
    this.getVentas();
    this.getIncidentes();
  }

  // Graficos
  generarGraficoProveedores() {
    // Agrupar las ventas por proveedor
    const ventasPorProveedor = this.ventas.reduce((acc, venta) => {
      const proveedor = venta.ID_VENDEDOR || 'Desconocido';
      acc[proveedor] = (acc[proveedor] || 0) + 1;
      return acc;
    }, {});

    // Ordenar por mayor número de ventas y tomar los top 5
    const topProveedores = Object.entries(ventasPorProveedor)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    // Configurar el gráfico Pie
    this.chartMejoresProveedores = {
      series: topProveedores.map((item: any) => item[1]),
      chart: {
        type: "pie",
        height: 500,
        width: "100%"
      },
      labels: topProveedores.map((item: any) => item[0]),
      legend: { position: "bottom" },
      dataLabels: {
        enabled: true
      },
      title: {
        text: "Mejor Proveedor (Más Ventas)",
        align: "center"
      }
    };
  }

  generarGraficoIncidentes() {
    const incidentesPorProveedor = this.incidentes.reduce((acc, incidente) => {
      const proveedor = incidente.ID_VENDEDOR || 'Desconocido';
      acc[proveedor] = (acc[proveedor] || 0) + 1;
      return acc;
    }, {});

    const topIncidentes = Object.entries(incidentesPorProveedor)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    this.chartIncidentesProveedores = {
      series: topIncidentes.map((item: any) => item[1]),
      chart: { type: "pie", height: 500, width: "100%" },
      labels: topIncidentes.map((item: any) => item[0]),
      legend: { position: "bottom" },
      dataLabels: { enabled: true },
      title: { text: "Proveedor con más incidentes", align: "center" }
    };
  }

  generarGraficoTiposIncidentes() {
    const tiposIncidentes = this.incidentes.reduce((acc, incidente) => {
      let tipo = "Datos incompletos";
      if (!incidente.ID_CILINDRO) tipo = "Falta ID de Cilindro";
      else if (!incidente.ID_VENDEDOR) tipo = "Falta ID de Vendedor";
      else if (!incidente.DOMICILIO) tipo = "Domicilio vacío";

      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    this.chartTiposIncidentes = {
      series: [{ name: "Incidentes", data: Object.values(tiposIncidentes) as number[] }],
      chart: { type: "bar", height: 345, width: "100%" },
      xaxis: { categories: Object.keys(tiposIncidentes) },
      title: { text: "Número de Incidentes por Tipo", align: "center" },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1 }
    };
  }

  generarGraficoActividadVentas() {
    if (this.ventasFiltradas.length === 0) return;
    const ventasPorMes = Array(12).fill(0);
    this.ventasFiltradas.forEach(venta => {
      const fechaVenta = new Date(venta.FECHA_VENTA.seconds * 1000);
      const mes = fechaVenta.getMonth();
      ventasPorMes[mes]++;
    });

    this.chartActividadVentas = {
      series: [{ name: "Ventas", data: ventasPorMes }],
      chart: { type: "bar", height: 300 },
      xaxis: { categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] },
      title: { text: "Actividad de Ventas por Mes", align: "center" },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1 }
    };
  }

  generarGraficoActividadIncidentes() {
    if (this.incidentesFiltrados.length === 0) return;
    const incidentesPorMes = Array(12).fill(0);
    this.incidentesFiltrados.forEach(incidente => {
      const fechaIncidente = new Date(incidente.FECHA_VENTA.seconds * 1000);
      const mes = fechaIncidente.getMonth();
      incidentesPorMes[mes]++;
    });

    this.chartActividadIncidentes = {
      series: [{ name: "Incidentes", data: incidentesPorMes }],
      chart: { type: "bar", height: 300 },
      xaxis: { categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] },
      title: { text: "Actividad de Incidentes por Mes", align: "center" },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1 }
    };
  }

}

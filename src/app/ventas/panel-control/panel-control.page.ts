import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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
import { GeoLocationService } from 'src/app/services/geo/geo-location.service';
import * as L from 'leaflet';
import { LoadingController, Platform } from '@ionic/angular';
import "leaflet.markercluster"; // 🔹 Importamos el clúster de Leaflet


@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.page.html',
  styleUrls: ['./panel-control.page.scss'],
})
export class PanelControlPage implements OnInit, OnDestroy, AfterViewInit {

  // Opciones del mapa
  options: any;
  // Capas (marcadores u overlays) que se mostrarán
  layers: any[] = [];

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

  // Variables tarjetas
  totalVentas: number = 0;
  totalIngresos: number = 0;
  totalIncidentes: number = 0;
  incidenteMasFrecuente: string = "N/A";


  // Variables para la tabla
  registros: any[] = [];
  registrosPaginados: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 5;

  // Variables para la tabla de incidentes
  incidentesLista: any[] = [];
  incidentesPagina: any[] = [];
  paginaActualIncidentes: number = 1;
  incidentesPorPagina: number = 5;

  // 🔹 Configuración del gráfico de pastel (Incidentes por Vendedor)
  graficoPastel: {
    series: number[];
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
  } = {
      series: [],
      chart: { type: "pie", width: "100%" },
      labels: [],
      colors: ["#FF4560", "#008FFB", "#00E396", "#FEB019", "#775DD0"],
      legend: { position: "bottom" }
    };



    graficoBarras: {
      series: { name: string; data: number[] }[];
      chart: ApexChart;
      xaxis: ApexXAxis;
      colors: string[];
      dataLabels: ApexDataLabels;
    } = {
      series: [{ name: "Incidentes", data: [] }],
      chart: { type: "bar", height: 250 },
      xaxis: {
        categories: [], // 🔹 Se llenará con los nombres de los incidentes
        labels: {
          rotate: -45, // 🔹 Rotar los nombres si son largos
          style: {
            fontSize: "12px",
            fontWeight: "bold"
          }
        }
      },
      colors: ["#FF4560"],
      dataLabels: {
        enabled: true, // 🔹 Mostrar números dentro de las barras
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          colors: ["#fff"] // 🔹 Texto blanco dentro de la barra
        }
      }
    };


  constructor(
    private ventasBuenasService: VentasBuenasService,
    private ventasSospechosService: VentasMalasService,
    private maps: GeoLocationService,
    private platform: Platform,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.actualizarReloj(); // Llamar a la función cuando inicia el componente
    this.intervalo = setInterval(() => this.actualizarReloj(), 1000); // Actualiza cada segundo
    this.getInfo();
    this.getInfoIncidentes();
    this.inicializarMapa(this.ventasRegistros)
  }

  async ngAfterViewInit() {
    const loading = await this.loadingController.create({
      message: 'Cargando mapa...',
      duration: 1000
    });

    await loading.present();

    setTimeout(() => {
      window.dispatchEvent(new Event('resize')); // 🔹 Redibujamos el mapa
    }, 1000);


  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo); // Limpia el intervalo al salir de la página
    }
  }

  async inicializarMapa(data: any) {
    // Configuración inicial del mapa
    this.options = {
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© OpenStreetMap contributors'
        })
      ],
      zoom: 13,
      center: L.latLng(22.768056, -102.533056) // Zacatecas como centro inicial
    };

    // Extraer direcciones de las ventas
    const direcciones = data.map((venta) => venta.DOMICILIO);
    console.log(direcciones)

    // Esperamos a que se agreguen marcadores con sus coordenadas
    this.layers = await this.maps.agregarMarcadores(direcciones);

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
        this.ventasRegistros = data;

        // 🔹 Calcular total de ventas e ingresos
        this.totalVentas = this.ventasRegistros.length;
        this.totalIngresos = this.ventasRegistros.reduce((total, venta) => total + parseFloat(venta.PRECIO), 0);

        // 🔹 Actualizar la tabla con la paginación
        this.registros = this.ventasRegistros;
        this.actualizarTabla(); // <-- 🔹 Aquí se integra la paginación

        // 🔹 Generar gráficos y actualizar el mapa después de obtener los datos
        setTimeout(() => {
          this.generarGraficoProveedores();
          this.generarGraficoVentasDia();
        }, 300);

        this.inicializarMapa(data);
      },
      error: (error) => console.error("Error al obtener las ventas buenas:", error),
    });
  }



  getInfoIncidentes() {
    this.ventasSospechosService.getVentas().subscribe({
      next: (data) => {
        this.ventasSospechosas = data;
        this.totalIncidentes = this.ventasSospechosas.length;
  
        const tiposIncidentes: { [key: string]: number } = {};
        const vendedoresIncidentes: { [key: string]: number } = {};
        this.incidentesLista = []; 
  
        this.ventasSospechosas.forEach((venta) => {
          let tipo = "Datos incompletos";
  
          if (!venta.ID_CILINDRO) tipo = "Falta ID de Cilindro";
          else if (!venta.ID_VENDEDOR) tipo = "Falta ID de Vendedor";
          else if (!venta.DOMICILIO) tipo = "Domicilio vacío";
  
          tiposIncidentes[tipo] = (tiposIncidentes[tipo] || 0) + 1;
          vendedoresIncidentes[venta.ID_VENDEDOR] = (vendedoresIncidentes[venta.ID_VENDEDOR] || 0) + 1;
  
          this.incidentesLista.push({
            ID_VENDEDOR: venta.ID_VENDEDOR,
            tipo: tipo,
            FECHA_VENTA: venta.FECHA_VENTA
          });
        });
  
        console.log("📌 Tipos de Incidentes (Categorías):", Object.keys(tiposIncidentes));
        console.log("📌 Cantidad de cada Incidente:", Object.values(tiposIncidentes));
  
        this.incidenteMasFrecuente = Object.keys(tiposIncidentes).reduce((a, b) =>
          tiposIncidentes[a] > tiposIncidentes[b] ? a : b, "N/A"
        );
  
        this.actualizarTablaIncidentes();
  
        this.graficoPastel.series = Object.values(vendedoresIncidentes);
        this.graficoPastel.labels = Object.keys(vendedoresIncidentes);
  
        // 🔹 Forzar actualización del gráfico de barras
        this.graficoBarras = { 
          ...this.graficoBarras, 
          series: [{ name: "Incidentes", data: Object.values(tiposIncidentes) }],
          xaxis: { categories: Object.keys(tiposIncidentes) }
        };
      },
      error: (error) => console.error("Error al obtener incidentes:", error),
    });
  }
  
  

  // 🔹 Paginación de incidentes
  actualizarTablaIncidentes() {
    const inicio = (this.paginaActualIncidentes - 1) * this.incidentesPorPagina;
    const fin = inicio + this.incidentesPorPagina;
    this.incidentesPagina = this.incidentesLista.slice(inicio, fin);
  }

  paginaAnteriorIncidentes() {
    if (this.paginaActualIncidentes > 1) {
      this.paginaActualIncidentes--;
      this.actualizarTablaIncidentes();
    }
  }

  paginaSiguienteIncidentes() {
    if (this.paginaActualIncidentes < this.getTotalPaginasIncidentes()) {
      this.paginaActualIncidentes++;
      this.actualizarTablaIncidentes();
    }
  }

  getTotalPaginasIncidentes(): number {
    return Math.ceil(this.incidentesLista.length / this.incidentesPorPagina);
  }

  // 🔹 Convertir fecha y hora desde Firebase Timestamp
  convertirFechaHora(segundos: number): string {
    const fecha = new Date(segundos * 1000);
    return fecha.toLocaleString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }


  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.registros.slice(inicio, fin);
  }

  // Métodos de Paginación
  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  getTotalPaginas(): number {
    return Math.ceil(this.registros.length / this.registrosPorPagina);
  }

  // Convertir fecha en formato legible
  convertirFecha(segundos: number): string {
    const fecha = new Date(segundos * 1000);
    return fecha.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
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
        height: 600, // Ajustamos la altura
        width: "155%" // Aseguramos que use el ancho del contenedor
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
        height: 335, // 🔹 Ajuste de altura para que coincida con el Pie Chart
        width: "160%" // 🔹 Se ajusta automáticamente al ancho del contenedor
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

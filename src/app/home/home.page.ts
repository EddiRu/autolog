import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase/firebase.service';
import { ExcelService } from '../services/excel/excel.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexResponsive,
} from "ng-apexcharts";

import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AgregarEventoComponent } from '../components/agregar-evento/agregar-evento.component';
import { EditarEventoComponent } from '../components/editar-evento/editar-evento.component';
import { DetallesEventoUnidadComponent } from '../components/detalles-evento-unidad/detalles-evento-unidad.component';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  title?: ApexTitleSubtitle;
  labels?: string[];
  responsive?: ApexResponsive[];
};


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  public chartPieTopCost: Partial<ChartOptions> = { series: [], labels: [] };
  public chartPieTopServices: Partial<ChartOptions> = { series: [], labels: [] };
  public chartBarMonthlyActivity: Partial<ChartOptions> = { series: [], xaxis: { categories: [] } };


  registros: any[] = []; // Lista completa de registros
  registrosPaginados: any[] = []; // Registros visibles en la página actual
  paginaActual: number = 1; // Página actual
  registrosPorPagina: number = 5; // Registros por página
  registrosOriginales: any[] = []; // Lista completa de registros sin filtrar

  fechaInicio: string | null = null; // Fecha inicial seleccionada
  fechaFin: string | null = null;   // Fecha final seleccionada




  constructor(
    private firebaseSerive: FirebaseService,
    private excelService: ExcelService,
    private router: Router,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadcontroller: LoadingController
  ) { }

  ngOnInit() {
    this.obtenerDatos();

  }

  setFechaInicio(event: any) {
    this.fechaInicio = event.detail.value; // Captura la fecha inicial seleccionada
    this.filtrarPorFechas(); // Filtra los registros al cambiar la fecha
  }

  setFechaFin(event: any) {
    this.fechaFin = event.detail.value; // Captura la fecha final seleccionada
    this.filtrarPorFechas(); // Filtra los registros al cambiar la fecha
  }

  filtrarPorFechas() {
    if (this.fechaInicio && this.fechaFin) {
      const inicio = new Date(this.fechaInicio).getTime();
      const fin = new Date(this.fechaFin).getTime();

      this.registros = this.registrosOriginales.filter((item) => {
        const fechaRegistro = new Date(item.fecha).getTime();
        return fechaRegistro >= inicio && fechaRegistro <= fin;
      });
    } else {
      this.registros = [...this.registrosOriginales];
    }

    this.actualizarTabla();
    this.generarGraficosConDatos(this.registros); // Actualizar gráficos con registros filtrados
  }





  async showLoading(msg: string) {
    const loading = await this.loadcontroller.create({
      message: msg,
      duration: 1500,
    });

    loading.present();
  }

  async presentToast(msg: string, position: 'top' | 'middle' | 'bottom', cl: 'danger' | 'success' | 'warning') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
      color: cl
    });

    await toast.present();
  }


  obtenerDatos() {
    this.getEventos();
    this.actualizarTabla();
  }

  async getEventos() {
    this.firebaseSerive.getEvento().subscribe({
      next: (data) => {
        const registrosOrdenados = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.registros = registrosOrdenados;
        this.registrosOriginales = [...registrosOrdenados];
        this.actualizarTabla();
        this.generarGraficos(); // Generar gráficos después de cargar y ordenar datos
      },
      error: (error) => {
        console.error('Error al obtener eventos:', error);
      },
    });
  }

  generarGraficos() {
    this.generarGraficosConDatos(this.registrosOriginales);
  }

  generarGraficosConDatos(datos: any[]) {
    const costoPorUnidad = datos.reduce((acc, registro) => {
      const placa = registro.unidad.unidad;
      acc[placa] = (acc[placa] || 0) + registro.costo;
      return acc;
    }, {});

    const topUnidades = Object.entries(costoPorUnidad)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);

    this.chartPieTopCost = {
      series: topUnidades.map((item: any) => item[1]),
      chart: { type: "pie", height: 300 },
      labels: topUnidades.map((item: any) => item[0]),
    };

    const serviciosPorUnidad = datos.reduce((acc, registro) => {
      const placa = registro.unidad.unidad; // Obtenemos la placa de la unidad
      acc[placa] = (acc[placa] || 0) + 1; // Incrementamos el contador de servicios para esa unidad
      return acc;
    }, {});
    
    const topServicios = Object.entries(serviciosPorUnidad)
      .sort((a: any, b: any) => b[1] - a[1]) // Ordenamos por cantidad de servicios en orden descendente
      .slice(0, 10); // Tomamos las 10 unidades con más servicios
    
    this.chartPieTopServices = {
      series: topServicios.map((item: any) => item[1]), // Cantidad de servicios como series
      chart: { type: "pie", height: 300 }, // Configuración del gráfico
      labels: topServicios.map((item: any) => item[0]), // Etiquetas con las placas de las unidades
    };
    

    const currentYear = new Date().getFullYear(); // Obtiene el año actual

    const actividadMensual = datos.reduce((acc, registro) => {
      const fechaRegistro = new Date(registro.fecha);
      const anioRegistro = fechaRegistro.getFullYear();
      const mesRegistro = fechaRegistro.getMonth();

      // Solo sumar los eventos del año actual
      if (anioRegistro === currentYear) {
        acc[mesRegistro] = (acc[mesRegistro] || 0) + 1;
      }
      return acc;
    }, Array(12).fill(0));

    this.chartBarMonthlyActivity = {
      series: [{ name: "Actividad", data: actividadMensual }],
      chart: { type: "bar", height: 300 },
      xaxis: {
        categories: [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ],
      },
      title: { text: `Actividad mensual en el año ${currentYear}` }, // Agrega el año en el título
    };
  }




  buscarEvento(event: any) {
    const query = event.target.value.toLowerCase(); // Convierte el texto ingresado a minúsculas

    if (query && query.trim() !== '') {
      // Filtra los registros por el término de búsqueda
      this.registros = this.registrosOriginales.filter((item) => {
        return (
          (item.unidad && item.unidad.unidad.toString().toLowerCase().includes(query)) || // Verifica si unidad es una cadena o convertible
          (item.servicio && item.servicio.toString().toLowerCase().includes(query)) || // Verifica si servicio es una cadena
          (item.articulo && item.articulo.toString().toLowerCase().includes(query)) || // Verifica si artículo es una cadena
          (item.fecha && item.fecha.toString().toLowerCase().includes(query)) // Verifica si fecha es una cadena
        );
      });
    } else {
      // Si no hay búsqueda, restaura los registros originales
      this.registros = [...this.registrosOriginales];
    }

    // Actualiza la tabla para mostrar los resultados filtrados
    this.actualizarTabla();
  }


  // Calcula el total de páginas
  getTotalPaginas(): number {
    return Math.ceil(this.registros.length / this.registrosPorPagina);
  }

  // Actualiza los registros visibles según la página actual
  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.registros.slice(inicio, fin);
  }

  reiniciarBusqueda() {
    this.fechaInicio = null; // Limpia la fecha inicial
    this.fechaFin = null;    // Limpia la fecha final
    this.registros = [...this.registrosOriginales]; // Restaura los datos originales
    this.actualizarTabla(); // Actualiza la tabla
  }

  // Cambia a la página siguiente
  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  // Cambia a la página anterior
  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  // EVENTOS
  // Agregar evento
  async agregarEvento() {
    const modalAddEvento = await this.modalController.create({
      component: AgregarEventoComponent,
      cssClass: 'my-custom-class'
    });

    modalAddEvento.present();
  }

  // Eliminar evento
  async borrarEvento(item: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el registro?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Eliminación cancelada');
          },
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          handler: () => {
            this.borrarRegistro(item);
          },
        },
      ],
    });

    await alert.present();
  }

  async borrarRegistro(item: any) {
    this.showLoading('Eliminando evento')
    try {
      this.firebaseSerive.deleteEvento(item.id).then((res => {
        this.actualizarTabla();
        this.presentToast('Evento eliminado correctamente', 'bottom', 'success');
      }))
    } catch (error) {
      this.presentToast('Error al eliminar evento', 'bottom', 'danger');
      console.error(error);
    }
  }

  // Editar un evento
  async editarEvento(item: any) {
    const modalEditEvento = await this.modalController.create({
      component: EditarEventoComponent,
      cssClass: 'my-custom-class',
      componentProps: {
        evento: item
      }
    });

    modalEditEvento.present();
  }

  // Exportar todos los eventos
  async exportarTodosLosEventos() {
    if (this.registrosOriginales.length > 0) {
      const registrosTransformados = this.registrosOriginales.map((registro) => {
        const { id, ...resto } = registro; // Excluye el campo `id`
        return {
          ...resto, // Copia todas las demás propiedades
          unidad: registro.unidad.unidad, // Reemplaza `unidad` con la placa
        };
      });

      const fechaAcutal = new Date().toISOString().split('T')[0];

      this.excelService.exportToExcel(registrosTransformados, 'reporte_general_' + fechaAcutal)
    } else {
      this.presentToast('No hay datos para exportar', 'bottom', 'warning');
    }
  }

  async exportarHisotiralEspesifico(item: any) {
    const auxItem: any = [{
      fecha: item.fecha,
      unidad: item.unidad.unidad,
      servicio: item.servicio,
      articulo: item.articulo,
      cantidad: item.costo
    }]

    this.excelService.exportToExcel(auxItem, 'reporte_' + item.unidad.unidad + '_' + item.fecha)
  }

  async detallesEventoRegistro(item: any) {
    const datos = this.registrosOriginales;
    const modalDetalesRegistro = await this.modalController.create({
      component: DetallesEventoUnidadComponent,
      cssClass:'my-custom-class-details',
      componentProps: {
        datos: datos,
        evento: item
      }
    });

    modalDetalesRegistro.present();
  }
}

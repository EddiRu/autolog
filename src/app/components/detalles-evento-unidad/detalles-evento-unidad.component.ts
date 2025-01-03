import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { ExcelService } from 'src/app/services/excel/excel.service';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-detalles-evento-unidad',
  templateUrl: './detalles-evento-unidad.component.html',
  styleUrls: ['./detalles-evento-unidad.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DetallesEventoUnidadComponent implements OnInit {

  @Input() datos: any;
  @Input() evento: any;

  public historialUnidad: any[] = []; // Almacena los registros filtrados
  registrosPaginados: any[] = []; // Registros visibles en la página actual
  paginaActual: number = 1; // Página actual
  registrosPorPagina: number = 5; // Registros por página

  public dineroInvertido: number = 0; // Total de dinero invertido en la unidad
  public ultimaFechaServicio: string = ""; // Última fecha de servicio
  public placaUnidad: string = ""; // Placa de la unidad
  public operadorUnidad: string = ""; // Operador asignado a la unidad


  nomOperador: string = ""


  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private excelService: ExcelService
  ) { }

  ngOnInit() {
    this.cargarHistorial();
    this.obtenerInformacionUnidad()
  }

  async obtenerInformacionUnidad() {
    // Obtener información del operador y asignar datos relevantes
    this.firebaseService.getAutos().subscribe({
      next: (autos) => {
        const unidad = autos.find((auto: any) => auto.id === this.evento.unidad.id);
        if (unidad) {
          this.operadorUnidad = unidad.operador || "No asignado";
          this.placaUnidad = unidad.unidad || "Sin placa";
        }
      },
      error: (error) => {
        console.error('Error al obtener información de la unidad:', error);
      },
    });

    // Calcular dinero invertido y última fecha de servicio
    const registrosFiltrados = this.datos.filter(
      (registro: any) => registro.unidad.unidad === this.evento.unidad.unidad
    );

    this.dineroInvertido = registrosFiltrados.reduce((acc, registro) => acc + registro.costo, 0);
    this.ultimaFechaServicio = registrosFiltrados
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]?.fecha || "Sin servicios";
  }

  async cargarHistorial() {
    // Filtra los registros por la misma unidad que el evento proporcionado
    this.historialUnidad = this.datos
      .filter((registro: any) => registro.unidad.unidad === this.evento.unidad.unidad)
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Ordena por fecha descendente

    // Inicializa la tabla con los registros paginados
    this.actualizarTabla();
  }

  getTotalPaginas(): number {
    return Math.ceil(this.historialUnidad.length / this.registrosPorPagina);
  }

  actualizarTabla() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.historialUnidad.slice(inicio, fin);
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarTabla();
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarTabla();
    }
  }

  exportarHisotiral() {
    const historialExportado = this.historialUnidad.map((registro: any) => {
      const { unidad, id, ...resto } = registro; // Excluye `unidad` y `id`
      return {
        ...resto, // Incluye las demás propiedades
        unidad: unidad.unidad // Solo guarda la placa de la unidad
      };
    });

    this.excelService.exportToExcel(historialExportado, 'reporte_'+this.operadorUnidad+'_'+this.placaUnidad)
  }

  async cancel() {
    await this.modalController.dismiss();
  }

}

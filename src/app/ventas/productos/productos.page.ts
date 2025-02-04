import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { DistribuidoresService } from 'src/app/services/admVentas/distribuidores/distribuidores.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
})
export class ProductosPage implements OnInit {

  distribuidores: any[] = [];
  distribuidoresFiltrados: any[] = [];
  distribuidoresPaginados: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  busqueda: string = '';

  constructor(
    private distribuidresService: DistribuidoresService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
  ) { }

  ngOnInit() {
    this.getInfo();
  }

  async getInfo() {
    this.distribuidresService.getDistribuidores().subscribe({
      next: (data) => {
        this.distribuidores = data;
        this.filtrarDistribuidores();
      },
      error: (error) => {
        console.error('Error al obtener los distribuidores:', error);
      }
    });
  }

  async presentToast(msg:string, position: 'top' | 'middle' | 'bottom', cl: 'danger' | 'success' | 'warning') {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
      color: cl
    });

    await toast.present();
  }

  filtrarDistribuidores() {
    if (!this.busqueda.trim()) {
      this.distribuidoresFiltrados = [...this.distribuidores];
    } else {
      const filtro = this.busqueda.toLowerCase();
      this.distribuidoresFiltrados = this.distribuidores.filter(distribuidor =>
        distribuidor.nombre.toLowerCase().includes(filtro) ||
        distribuidor.identificador.toLowerCase().includes(filtro)
      );
    }
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.distribuidoresPaginados = this.distribuidoresFiltrados.slice(inicio, fin);
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  getTotalPaginas(): number {
    return Math.ceil(this.distribuidoresFiltrados.length / this.registrosPorPagina);
  }

  async seleccionarDistribuidor(distribuidor){

  }

}

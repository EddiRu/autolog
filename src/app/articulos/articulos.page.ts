import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase/firebase.service';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AgregarArticuloComponent } from '../components/agregar-articulo/agregar-articulo.component';

@Component({
  selector: 'app-articulos',
  templateUrl: './articulos.page.html',
  styleUrls: ['./articulos.page.scss'],
})
export class ArticulosPage implements OnInit {

  articulos: any[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private modalController: ModalController,
    private alertController: AlertController,
    private loadcontroller: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.getArticulos();
  }

  async getArticulos(){
    this.firebaseService.getArticulos().subscribe({
      next: (articulos) => {
        this.articulos = articulos;
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  async showLoading(msg:string) {
    const loading = await this.loadcontroller.create({
      message: msg,
      duration: 1500,
    });

    loading.present();
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

  async agregarArticulo(){
    const modalAgregarArticulos = await this.modalController.create({
      component: AgregarArticuloComponent,
      cssClass: 'articulo-css'
    });

    modalAgregarArticulos.present();
  }

  async editarArticulo(articulo:any){
    const modalEditarArticulo = await this.modalController.create({
      component: AgregarArticuloComponent,
      cssClass: 'articulo-css',
      componentProps: {
        articulo: articulo
      }
    });

    modalEditarArticulo.present();
  }

  async borrarArticulo(item:any){

  }

}

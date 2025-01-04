import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-agregar-evento',
  templateUrl: './agregar-evento.component.html',
  styleUrls: ['./agregar-evento.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AgregarEventoComponent implements OnInit {

  eventoNuevo: FormGroup;

  public autos: any = [];

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
    this.getAutos();
    this.eventoNuevo = this.fb.group({
      unidad: ['', Validators.required],
      kilometraje: ['', Validators.required],
      servicio: ['', Validators.required],
      articulo: ['', Validators.required],
      costo: ['', Validators.required],
      autUser: ['', Validators.required],
      fecha: [new Date().toISOString().split('T')[0]]
    })
  }

  async getAutos() {
    this.firebaseService.getAutos().subscribe({
      next: (data) => {
        this.autos = data;
      },
      error: (error) => {
        console.log('Error getting documents', error);
      }
    })
  }

  async cancel() {
    this.eventoNuevo.reset();
    await this.modalController.dismiss();
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

  async agregarEvento() {
    await this.showLoading('Agregando evento...');

    if (this.eventoNuevo.valid) {
      try {
        const unidad: any = await this.autos.filter((d: any) => d.id === this.eventoNuevo.get('unidad').value);

        const undiadAux = {
          id: unidad[0]['id'],
          unidad: unidad[0]['unidad']
        };

        this.eventoNuevo.get('unidad').setValue(undiadAux);

        this.firebaseService.addEvento(this.eventoNuevo.value).then((res:any) => {
          this.presentToast('Evento agregado correctamente', 'bottom','success');
          this.cancel();
        })

      } catch (error) {
        await this.presentToast('Error al agregar evento', 'bottom', 'danger');
        console.error('Error adding document:', error);
        return;
      }
    } else {
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
    }
  }

}

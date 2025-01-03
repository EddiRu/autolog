import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-editar-evento',
  templateUrl: './editar-evento.component.html',
  styleUrls: ['./editar-evento.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class EditarEventoComponent implements OnInit {

  @Input() evento:any;

  editarEventoRegistro: FormGroup;

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
    console.log(this.evento)
    this.editarEventoRegistro = this.fb.group({
      id: [this.evento.id, Validators.required],
      unidad: [this.evento.unidad.id, Validators.required],
      kilometraje: [this.evento.kilometraje, Validators.required],
      servicio: [this.evento.servicio, Validators.required],
      articulo: [this.evento.articulo, Validators.required],
      costo: [this.evento.costo, Validators.required],
      fecha: [new Date().toISOString().split('T')[0]]
    })
  }

  async cancel() {
    this.editarEventoRegistro.reset();
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



  async editarEvento() {
    await this.showLoading('Editando evento...');

    if (this.editarEventoRegistro.valid) {
      try {
        const unidad: any = await this.autos.filter((d: any) => d.id === this.editarEventoRegistro.get('unidad').value);

        const undiadAux = {
          id: unidad[0]['id'],
          unidad: unidad[0]['unidad']
        };

        this.editarEventoRegistro.get('unidad').setValue(undiadAux);

        this.firebaseService.updateEvento(this.editarEventoRegistro.value).then((res:any) => {
          this.presentToast('Evento editado correctamente', 'bottom','success');
          this.cancel();
        })

      } catch (error) {
        await this.presentToast('Error al editar evento', 'bottom', 'danger');
        console.error('Error adding document:', error);
        return;
      }
    } else {
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
    }
  }

}

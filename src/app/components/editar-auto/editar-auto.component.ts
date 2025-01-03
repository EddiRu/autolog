import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase/firebase.service';

@Component({
  selector: 'app-editar-auto',
  templateUrl: './editar-auto.component.html',
  styleUrls: ['./editar-auto.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonicModule, CommonModule]
})
export class EditarAutoComponent implements OnInit {

  @Input() auto:any;

  public editarAuto: FormGroup

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.editarAuto = this.fb.group({
      id: [this.auto.id, Validators.required],
      unidad: [this.auto.unidad, Validators.required],
      kilometraje: [this.auto.kilometraje, Validators.required],
      operador: [this.auto.operador, Validators.required],
      desc: [this.auto.desc, Validators.required]
    });
  }

  async cancel(){
    this.editarAuto.reset();
    await this.modalController.dismiss();
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

  async editarAutoFirebase(){
    this.showLoading('Editando auto...');
    if(this.editarAuto.valid){
      try {
        this.firebaseService.updateAuto(this.editarAuto.value).then((res:any) => {
          this.presentToast('Auto editado correctamente', 'bottom','success');
          this.cancel();
        })
      } catch (error) {
        this.presentToast('Hubo un error al editar el auto', 'bottom', 'danger');
        console.error(error);
      }
    }else{
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
      return;
    }
  }


}

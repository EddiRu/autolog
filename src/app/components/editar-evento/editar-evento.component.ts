import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  @Input() evento: any;

  editarEventoRegistro: FormGroup;
  autos: any[] = [];
  articulosFiltrados: any[] = [];
  totalSinIVA: number = 0;
  totalConIVA: number = 0;

  constructor(
    private modalController: ModalController,
    private loadcontroller: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.getAutos();
    this.editarEventoRegistro = this.fb.group({
      id: [this.evento.id, Validators.required],
      unidad: [this.evento.unidad.id, Validators.required],
      kilometraje: [this.evento.kilometraje, Validators.required],
      servicio: [this.evento.servicio, Validators.required],
      costo: [this.evento.costo, Validators.required],
      fecha: [this.evento.fecha, Validators.required],
      autUser: [this.evento.autUser || '', Validators.required],
      articulos: this.fb.array(this.evento.articulos.map((articulo: any) =>
        this.fb.group({
          nombre: [articulo.nombre, Validators.required],
          precio: [articulo.precio, Validators.required],
          cantidad: [articulo.cantidad, [Validators.required, Validators.min(1)]]
        })
      ))
    });

    this.calcularTotales();
  }

  get articulosFormArray(): FormArray {
    return this.editarEventoRegistro.get('articulos') as FormArray;
  }

  async getAutos() {
    this.firebaseService.getAutos().subscribe({
      next: (data) => {
        this.autos = data;
      },
      error: (error) => {
        console.error('Error getting documents', error);
      }
    });
  }

  filtrarArticulos(event: any) {
    const query = event.target.value.toLowerCase();
    if (query.trim() === '') {
      this.articulosFiltrados = [];
      return;
    }

    // Implementación de búsqueda
    // Actualizar la lista según tus datos
  }

  agregarArticulo(articulo: any) {
    const existe = this.articulosFormArray.controls.some(
      (control) => control.value.nombre === articulo.nombre
    );
    if (existe) return;

    this.articulosFormArray.push(
      this.fb.group({
        nombre: [articulo.nombre, Validators.required],
        precio: [articulo.precio, Validators.required],
        cantidad: [1, [Validators.required, Validators.min(1)]]
      })
    );
    this.calcularTotales();
  }

  eliminarArticulo(index: number) {
    this.articulosFormArray.removeAt(index);
    this.calcularTotales();
  }

  calcularTotales() {
    const articulos = this.articulosFormArray.value;
    this.totalSinIVA = articulos.reduce(
      (sum, articulo) => sum + articulo.precio * articulo.cantidad,
      0
    );
    this.totalConIVA = this.totalSinIVA * 1.16;
    this.editarEventoRegistro.get('costo')?.setValue(this.totalConIVA);
  }

  async editarEvento() {
    if (this.editarEventoRegistro.valid) {
      try {
        // Obtenemos el ID de la unidad seleccionada
        const unidadSeleccionadaId = this.editarEventoRegistro.get('unidad')?.value;
  
        // Buscamos la unidad en el listado de autos
        const unidadSeleccionada = this.autos.find((auto: any) => auto.id === unidadSeleccionadaId);
  
        // Creamos un objeto con la unidad (id y nombre) y otros datos del formulario
        const updatedEvento = {
          ...this.editarEventoRegistro.value,
          unidad: {
            id: unidadSeleccionada.id,
            unidad: unidadSeleccionada.unidad,
          },
        };
  
        // Guardamos el evento actualizado en Firebase
        await this.firebaseService.updateEvento(updatedEvento);
  
        this.presentToast('Evento editado correctamente', 'bottom', 'success');
        this.cancel();
      } catch (error) {
        console.error('Error al editar el evento:', error);
        this.presentToast('Error al editar evento', 'bottom', 'danger');
      }
    } else {
      this.presentToast('Todos los campos son obligatorios', 'bottom', 'warning');
    }
  }

  async cancel() {
    this.modalController.dismiss();
  }

  async presentToast(msg: string, position: 'top' | 'middle' | 'bottom', color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position,
      color
    });
    toast.present();
  }
}

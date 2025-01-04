import { Injectable } from '@angular/core';
import {
  doc,
  collection,
  collectionData,
  docData,
  Firestore,
  updateDoc
} from '@angular/fire/firestore';
import {
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import {
  Auth
} from '@angular/fire/auth';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private firestore: Firestore
  ) { }

  /*
      A D M I N I S T R A C I Ó N    D E     E V E N T O S
  */
      getEvento(): Observable<any[]> {
        const registroRef = collection(this.firestore, 'eventos');
        return collectionData(registroRef, {idField: 'id'}) as Observable<any[]>;
      }
    
      getEventoById(id: string): Observable<any> {
        const registroRef = doc(this.firestore, `eventos/${id}`);
        return docData(registroRef) as Observable<any>;
      }
    
      addEvento(reporte: any): Promise<any> {
        return addDoc(collection(this.firestore, 'eventos'), reporte);
      }
    
      deleteEvento(id:string){
        const registroRef = doc(this.firestore, `eventos/${id}`);
        return deleteDoc(registroRef);
      }
    
      updateEvento(reporte: any): Promise<any> {
        const registroRef = doc(this.firestore, `eventos/${reporte.id}`);
        return updateDoc(registroRef, {
          unidad: reporte.unidad,
          kilometraje: reporte.kilometraje,
          servicio: reporte.servicio,
          articulo: reporte.articulo,
          costo: reporte.costo,
          fecha: reporte.fecha
        });
      }


  /*
      A D M I N I S T R A C I O N       D E     A U T O S
  */
  
  getAutos(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'autos');
    return collectionData(registroRef, {idField: 'id'}) as Observable<any[]>;
  }

  getAutoById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `autos/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addAuto(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'autos'), reporte);
  }

  deleteAuto(id:string){
    const registroRef = doc(this.firestore, `autos/${id}`);
    return deleteDoc(registroRef);
  }

  updateAuto(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `autos/${reporte.id}`);
    return updateDoc(registroRef, {
      unidad: reporte.unidad,
      operador: reporte.operador,
      kilometraje: reporte.kilometraje,
      desc: reporte.desc
    });
  }


  /*

  A D M I N I S T R A C I Ó N     D E     A R T Í C U L O S

  */

  getArticulos(): Observable<any[]> {
    const registroRef = collection(this.firestore, 'articulos');
    return collectionData(registroRef, {idField: 'id'}) as Observable<any[]>;
  }

  getArticuloById(id: string): Observable<any> {
    const registroRef = doc(this.firestore, `articulos/${id}`);
    return docData(registroRef) as Observable<any>;
  }

  addArticulo(reporte: any): Promise<any> {
    return addDoc(collection(this.firestore, 'articulos'), reporte);
  }

  deleteArticulo(id:string){
    const registroRef = doc(this.firestore, `articulos/${id}`);
    return deleteDoc(registroRef);
  }

  updateArticulo(reporte: any): Promise<any> {
    const registroRef = doc(this.firestore, `articulos/${reporte.id}`);
    return updateDoc(registroRef, {
      articulo: reporte.articulo,
      precio: reporte.precio,
      desc: reporte.desc,
    });
  }
}

import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

   /**
   * Exporta datos a un archivo Excel.
   * @param data Array de objetos o datos a exportar.
   * @param fileName Nombre del archivo Excel.
   */
   exportToExcel(data: any[], fileName: string): void {
    
    // Crear una hoja de trabajo (worksheet) a partir de los datos
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Crear un libro de trabajo (workbook) y agregar la hoja
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Datos': worksheet },
      SheetNames: ['Datos']
    };

    // Generar el archivo Excel en formato binario
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Guardar el archivo usando FileSaver
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  /**
   * Guarda el archivo Excel usando FileSaver.
   * @param buffer Datos binarios del archivo.
   * @param fileName Nombre del archivo.
   */
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, `${fileName}.xlsx`);
  }
  
}

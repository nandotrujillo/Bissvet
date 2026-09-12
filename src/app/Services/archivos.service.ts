import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArchivoHistoriaClinica } from '../Models/archivo-historia-clinica';

@Injectable({ providedIn: 'root' })
export class ArchivosService {
  private apiUrl = `${environment.apiUrl}/archivos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  listarPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  crear(archivo: ArchivoHistoriaClinica): Observable<any> {
    return this.http.post(this.apiUrl, archivo);
  }

  subirArchivo(
    idHistoriaClinica: number,
    archivo: File,
    tipoArchivo: string,
    descripcion?: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    formData.append('IdHistoriaClinica', String(idHistoriaClinica));
    formData.append('TipoArchivo', tipoArchivo || 'Documento');
    if (descripcion) {
      formData.append('Descripcion', descripcion);
    }
    return this.http.post(this.apiUrl, formData);
  }

  urlDescargar(id: number): string {
    return `${this.apiUrl}/descargar/${id}`;
  }

  descargar(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/${id}`, {
      responseType: 'blob'
    });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

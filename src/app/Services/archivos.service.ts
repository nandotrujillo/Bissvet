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

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

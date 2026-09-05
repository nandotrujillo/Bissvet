import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Procedimiento } from '../Models/procedimiento';

@Injectable({ providedIn: 'root' })
export class ProcedimientosService {
  private apiUrl = `${environment.apiUrl}/procedimientos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  listarPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  crear(procedimiento: Procedimiento): Observable<any> {
    return this.http.post(this.apiUrl, procedimiento);
  }

  actualizar(id: number, procedimiento: Procedimiento): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, procedimiento);
  }
}

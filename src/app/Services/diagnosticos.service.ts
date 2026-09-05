import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Diagnostico } from '../Models/diagnostico';

@Injectable({ providedIn: 'root' })
export class DiagnosticosService {
  private apiUrl = `${environment.apiUrl}/diagnosticos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  listarPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  crear(diagnostico: Diagnostico): Observable<any> {
    return this.http.post(this.apiUrl, diagnostico);
  }

  actualizar(id: number, diagnostico: Diagnostico): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, diagnostico);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

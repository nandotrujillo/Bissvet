import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TipoPago } from '../Models/tipo-pago';

@Injectable({
  providedIn: 'root'
})
export class TipoPagoService {

  private apiUrl = `${environment.apiUrl}/tipos-pago`;

  constructor(private http: HttpClient) {}

  listar(activos?: boolean): Observable<any> {
    return this.http.get<any>(this.apiUrl, activos ? { params: { activos: '1' } } : undefined);
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(tipo: TipoPago): Observable<any> {
    return this.http.post<any>(this.apiUrl, tipo);
  }

  actualizar(id: number, tipo: TipoPago): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, tipo);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
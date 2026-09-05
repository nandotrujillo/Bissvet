import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Suscripcion } from '../Models/suscripcion';

@Injectable({ providedIn: 'root' })
export class SuscripcionesService {
  private apiUrl = `${environment.apiUrl}/suscripciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(suscripcion: Suscripcion): Observable<any> {
    return this.http.post<any>(this.apiUrl, suscripcion);
  }

  actualizar(id: number, suscripcion: Partial<Suscripcion>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, suscripcion);
  }

  cambiarPlan(id: number, IdPlanNuevo: number, Motivo?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/cambiar-plan`, { IdPlanNuevo, Motivo });
  }

  guardarAddons(id: number, modulos: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/addons`, { modulos });
  }
}
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan } from '../Models/plan';

@Injectable({ providedIn: 'root' })
export class PlanesService {
  private apiUrl = `${environment.apiUrl}/planes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  tiposLimite(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tipos-limite`);
  }

  miPlan(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mi-plan`);
  }

  consumo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/consumo`);
  }

  crear(plan: Plan): Observable<any> {
    return this.http.post<any>(this.apiUrl, plan);
  }

  actualizar(id: number, plan: Plan): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, plan);
  }

  cambiarEstado(id: number, activo: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { Activo: activo });
  }

  guardarModulos(id: number, modulos: number[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/modulos`, { modulos });
  }

  guardarLimites(id: number, limites: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/limites`, { limites });
  }
}
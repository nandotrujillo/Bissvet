import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Servicio } from '../Models/servicio';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private apiUrl = `${environment.apiUrl}/servicios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  obtener(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crear(servicio: Servicio): Observable<any> {
    return this.http.post(this.apiUrl, servicio);
  }

  actualizar(id: number, servicio: Servicio): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      servicio
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }

}

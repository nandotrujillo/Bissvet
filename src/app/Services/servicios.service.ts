import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Servicio {
  IdServicio: number;
  IdCategoriaServicio: number;
  Nombre: string;
  Precio: number;
  Activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private apiUrl = 'http://localhost:3000/api/servicios';

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
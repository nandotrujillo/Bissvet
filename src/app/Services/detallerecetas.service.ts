import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleReceta } from '../Models/receta';

@Injectable({ providedIn: 'root' })
export class DetalleRecetasService {
  private apiUrl = 'http://localhost:3000/api/detallerecetas';

  constructor(private http: HttpClient) {}

  listarPorReceta(idReceta: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/receta/${idReceta}`);
  }

  crear(detalle: DetalleReceta): Observable<any> {
    return this.http.post(this.apiUrl, detalle);
  }

  actualizar(id: number, detalle: DetalleReceta): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, detalle);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

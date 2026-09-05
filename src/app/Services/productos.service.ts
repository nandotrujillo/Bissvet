import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Producto } from '../Models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  listar(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(producto: Producto): Observable<any> {
    return this.http.post<any>(this.apiUrl, producto);
  }

  actualizar(id: number, producto: Producto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, producto);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

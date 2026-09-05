import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Proveedor } from '../Models/proveedor';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private apiUrl = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  listar(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(proveedor: Proveedor): Observable<any> {
    return this.http.post<any>(this.apiUrl, proveedor);
  }

  actualizar(id: number, proveedor: Proveedor): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, proveedor);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

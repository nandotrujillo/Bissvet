import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CategoriaProducto } from '../Models/categoria-producto';

@Injectable({
  providedIn: 'root'
})
export class CategoriasProductoService {

  private apiUrl = `${environment.apiUrl}/categorias-producto`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  crear(categoria: CategoriaProducto): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoria);
  }

  actualizar(id: number, categoria: CategoriaProducto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, categoria);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

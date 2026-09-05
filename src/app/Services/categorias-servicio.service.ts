import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CategoriaServicio } from '../Models/categoria-servicio';

@Injectable({
  providedIn: 'root'
})
export class CategoriasServicioService {

  private apiUrl = `${environment.apiUrl}/categorias-servicio`;

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // LISTAR CATEGORÍAS
  // =====================================================

  listar(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl
    );

  }


  // =====================================================
  // OBTENER POR ID
  // =====================================================

  obtener(id: number): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );

  }


  // =====================================================
  // CREAR
  // =====================================================

  crear(
    categoria: CategoriaServicio
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      categoria
    );

  }


  // =====================================================
  // ACTUALIZAR
  // =====================================================

  actualizar(
    id: number,
    categoria: CategoriaServicio
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      categoria
    );

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(
    id: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );

  }

}

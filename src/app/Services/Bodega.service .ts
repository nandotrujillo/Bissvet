
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Bodega } from '../Models/bodega';

@Injectable({
  providedIn: 'root'
})
export class BodegaService {

  private apiUrl = 'http://localhost:3000/api/bodegas';

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(bodega: Bodega): Observable<any> {
    return this.http.post<any>(this.apiUrl, bodega);
  }

  actualizar(id: number, bodega: Bodega): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      bodega
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );
  }
}


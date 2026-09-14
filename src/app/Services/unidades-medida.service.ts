import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnidadesMedidaService {

  private apiUrl = `${environment.apiUrl}/unidades-medida`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  crear(unidad: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, unidad);
  }

  actualizar(id: number, unidad: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, unidad);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

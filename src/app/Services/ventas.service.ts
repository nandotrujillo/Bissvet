import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private apiUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  listar(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(body: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }

  actualizar(id: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, body);
  }

  confirmar(id: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/confirmar`, body);
  }

  anular(id: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/anular`, body);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

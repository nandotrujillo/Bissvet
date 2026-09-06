import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {

  private apiUrl = `${environment.apiUrl}/tipos-documento`;

  constructor(private http: HttpClient) {}

  listar(activos?: boolean): Observable<any> {
    const params: any = {};
    if (activos) { params.activos = 1; }
    return this.http.get<any>(this.apiUrl, { params });
  }

  crear(body: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }

  actualizar(id: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, body);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
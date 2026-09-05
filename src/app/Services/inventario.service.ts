import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private apiUrl = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  listar(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  consolidado(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/consolidado`);
  }

  inicial(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/inicial`, body);
  }
}

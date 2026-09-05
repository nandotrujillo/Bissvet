import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private apiUrl = 'http://localhost:3000/api/inventario';

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
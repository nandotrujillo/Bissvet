import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KardexService {

  private apiUrl = 'http://localhost:3000/api/kardex';

  constructor(private http: HttpClient) {}

  listar(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  resumen(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen`, { params });
  }
}
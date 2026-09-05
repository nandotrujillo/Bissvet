import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KardexService {

  private apiUrl = `${environment.apiUrl}/kardex`;

  constructor(private http: HttpClient) {}

  listar(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  resumen(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen`, { params });
  }
}

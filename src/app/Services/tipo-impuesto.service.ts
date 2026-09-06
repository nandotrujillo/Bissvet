import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoImpuestoService {

  private apiUrl = `${environment.apiUrl}/tipos-impuesto`;

  constructor(private http: HttpClient) {}

  listar(soloIva?: boolean): Observable<any> {
    const params: any = {};
    if (soloIva) { params.soloIva = 1; }
    return this.http.get<any>(this.apiUrl, { params });
  }

  impuestoVentas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ventas`);
  }
}
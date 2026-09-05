import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SignosVitales } from '../Models/signos-vitales';

@Injectable({ providedIn: 'root' })
export class SignosVitalesService {
  private apiUrl = `${environment.apiUrl}/signosvitales`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  obtenerPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  crear(signos: SignosVitales): Observable<any> {
    return this.http.post(this.apiUrl, signos);
  }

  actualizar(id: number, signos: SignosVitales): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, signos);
  }
}

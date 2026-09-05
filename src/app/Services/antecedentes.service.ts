import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Antecedente } from '../Models/antecedente';

@Injectable({ providedIn: 'root' })
export class AntecedentesService {
  private apiUrl = `${environment.apiUrl}/antecedentes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  obtenerPorMascota(idMascota: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mascota/${idMascota}`);
  }

  crear(antecedente: Antecedente): Observable<any> {
    return this.http.post(this.apiUrl, antecedente);
  }

  actualizar(id: number, antecedente: Antecedente): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, antecedente);
  }
}

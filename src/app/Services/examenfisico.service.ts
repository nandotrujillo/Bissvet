import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExamenFisico } from '../Models/examen-fisico';

@Injectable({ providedIn: 'root' })
export class ExamenFisicoService {
  private apiUrl = 'http://localhost:3000/api/examenfisico';

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  obtenerPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  crear(examen: ExamenFisico): Observable<any> {
    return this.http.post(this.apiUrl, examen);
  }

  actualizar(id: number, examen: ExamenFisico): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, examen);
  }
}

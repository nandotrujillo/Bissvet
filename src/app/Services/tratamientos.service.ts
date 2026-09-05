import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tratamiento } from '../Models/tratamiento';

@Injectable({ providedIn: 'root' })
export class TratamientosService {
  private apiUrl = 'http://localhost:3000/api/tratamientos';

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  listarPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  listarActivosPorMascota(idMascota: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mascota/${idMascota}/activos`);
  }

  crear(tratamiento: Tratamiento): Observable<any> {
    return this.http.post(this.apiUrl, tratamiento);
  }

  actualizar(id: number, tratamiento: Tratamiento): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, tratamiento);
  }

  finalizar(id: number, usuarioId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/finalizar`, { UsuarioIdModificacion: usuarioId });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

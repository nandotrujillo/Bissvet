import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoriaClinica } from '../Models/historia-clinica';

@Injectable({ providedIn: 'root' })
export class HistoriasClinicasService {
  private apiUrl = 'http://localhost:3000/api/historiasclinicas';

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  listarPorMascota(idMascota: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mascota/${idMascota}`);
  }

  obtener(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crear(historia: HistoriaClinica): Observable<any> {
    return this.http.post(this.apiUrl, historia);
  }

  actualizar(id: number, historia: HistoriaClinica): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, historia);
  }

  cerrar(id: number, usuarioId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cerrar`, { UsuarioIdModificacion: usuarioId });
  }
}

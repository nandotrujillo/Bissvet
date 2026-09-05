import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cirugia } from '../Models/cirugia';

@Injectable({ providedIn: 'root' })
export class CirugiasService {
  private apiUrl = 'http://localhost:3000/api/cirugias';

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  listarPorMascota(idMascota: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mascota/${idMascota}`);
  }

  listarPorHistoria(idHistoriaClinica: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historia/${idHistoriaClinica}`);
  }

  obtener(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crear(cirugia: Cirugia): Observable<any> {
    return this.http.post(this.apiUrl, cirugia);
  }

  actualizar(id: number, cirugia: Cirugia): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cirugia);
  }

  registrarPreoperatorio(id: number, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/preoperatorio`, datos);
  }

  registrarAnestesico(id: number, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/anestesico`, datos);
  }

  registrarPostoperatorio(id: number, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/postoperatorio`, datos);
  }
}

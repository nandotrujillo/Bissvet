import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Control } from '../Models/control';

@Injectable({ providedIn: 'root' })
export class ControlesService {
  private apiUrl = `${environment.apiUrl}/controles`;

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

  listarProximos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/proximos`);
  }

  obtener(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crear(control: Control): Observable<any> {
    return this.http.post(this.apiUrl, control);
  }

  actualizar(id: number, control: Control): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, control);
  }
}

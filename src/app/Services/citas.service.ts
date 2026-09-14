import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cita {
  IdCita?: number;
  IdMascota: number;
  IdServicio: number;
  IdVeterinario: number;
  UsuarioIdVeterinario?: number;
  FechaCita: string;
  HoraCita: string;
  Precio: number;
  Estado: string;
  MotivoConsulta?: string;
  Observaciones?: string;
  UsuarioIdCreacion?: number;
  FechaModificacion: string;
  UsuarioIdModificacion: number;
  // Join fields
  NombreServicio?: string;
  NombreMascota?: string;
  IdCategoriaServicio?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  private apiUrl = `${environment.apiUrl}/citas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  obtener(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crear(cita: Cita): Observable<any> {
    return this.http.post(this.apiUrl, cita);
  }

  actualizar(id: number, cita: Cita): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cita);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  listarPorMascota(idMascota: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mascota/${idMascota}`);
  }

  listarPorFecha(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fecha/${fecha}`);
  }

  listarPorVeterinario(idVeterinario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/veterinario/${idVeterinario}`);
  }

  imprimirPDF(id: number): string {
    return `${this.apiUrl}/${id}/pdf`;
  }
}

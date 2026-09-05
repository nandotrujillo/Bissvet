import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ciudad {
  Id?: number;
  IdPais?: number;
  Ciudad: string;
  CodigoCiudad?: string;
  Departamento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CiudadService {

  private apiUrl = `${environment.apiUrl}/ciudades`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}

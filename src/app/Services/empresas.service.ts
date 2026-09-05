import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa } from '../Models/empresa';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private apiUrl = 'http://localhost:3000/api/empresas';

  constructor(private http: HttpClient) {}

  obtenerEmpresas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`);
  }

  obtenerEmpresaPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, empresa: Empresa): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      empresa
    );
  }

}
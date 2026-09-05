import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Cliente } from '../Models/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = 'http://localhost:3000/api/clientes';

  constructor(
    private http: HttpClient
  ) {}

  listar(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl
    );

  }

  obtener(id: number): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );

  }

  crear(cliente: Cliente): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      cliente
    );

  }

  actualizar(
    id: number,
    cliente: Cliente
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      cliente
    );

  }

  eliminar(id: number): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );

  }

}
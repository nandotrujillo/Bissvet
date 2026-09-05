import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Veterinario } from '../Models/veterinario';

@Injectable({
  providedIn: 'root'
})
export class VeterinariosService {

  private apiUrl =
    `${environment.apiUrl}/veterinarios`;

  constructor(
    private http: HttpClient
  ) {}

  listar(): Observable<{ ok: boolean; datos: Veterinario[] }> {

    return this.http.get<{ ok: boolean; datos: Veterinario[] }>(
      this.apiUrl
    );

  }

  obtener(id: number): Observable<{ ok: boolean; datos: Veterinario }> {

    return this.http.get<{ ok: boolean; datos: Veterinario }>(
      `${this.apiUrl}/${id}`
    );

  }

  crear(
    veterinario: Veterinario
  ): Observable<{ ok: boolean; mensaje: string; datos: Veterinario }> {

    return this.http.post<{ ok: boolean; mensaje: string; datos: Veterinario }>(
      this.apiUrl,
      veterinario
    );

  }

  actualizar(
    id: number,
    veterinario: Veterinario
  ): Observable<{ ok: boolean; mensaje: string; datos: Veterinario }> {

    return this.http.put<{ ok: boolean; mensaje: string; datos: Veterinario }>(
      `${this.apiUrl}/${id}`,
      veterinario
    );

  }

  eliminar(
    id: number
  ): Observable<{ ok: boolean; mensaje: string }> {

    return this.http.delete<{ ok: boolean; mensaje: string }>(
      `${this.apiUrl}/${id}`
    );

  }

}

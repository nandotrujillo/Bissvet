import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../Models/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  validarUsuario(
    Username: string,
    PasswordHash: string,
    IdEmpresa: number
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      {
        Username,
        PasswordHash,
        IdEmpresa
      }
    );
  }

  cerrarSesion(IdSesion: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/logout`,
      { IdSesion }
    );
  }

  obtenerUsuarios(): Observable<{ ok: boolean; datos: Usuario[] }> {
    return this.http.get<{ ok: boolean; datos: Usuario[] }>(this.apiUrl);
  }

  obtenerUsuarioPorId(id: number): Observable<{ ok: boolean; datos: Usuario }> {
    return this.http.get<{ ok: boolean; datos: Usuario }>(
      `${this.apiUrl}/${id}`
    );
  }

  crearUsuario(payload: Usuario): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  actualizarUsuario(id: number, payload: Usuario): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  cambiarClave(id: number, Password: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/cambiar-password`,
      { Password }
    );
  }

  desbloquear(id: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      { Bloqueado: false }
    );
  }
}

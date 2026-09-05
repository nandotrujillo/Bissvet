import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  UsuarioId: number;
  Username: string;
  PasswordHash?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(private http: HttpClient) {}

  validarUsuario(
    Username: string,
    PasswordHash: string,
    IdEmpresa: number
  ): Observable<any> {
    console.log("Desde el servicio");
   console.log(Username);
   console.log(IdEmpresa);
   console.log(`${this.apiUrl}/login`);
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      {
        Username, 
        PasswordHash,
        IdEmpresa
      }
    );
  }

  obtenerUsuarios(): Observable<Usuario[]> {

    return this.http.get<Usuario[]>(this.apiUrl);

  }

  obtenerUsuarioPorId(id: number): Observable<Usuario> {

    return this.http.get<Usuario>(
      `${this.apiUrl}/${id}`
    );

  }

crearUsuario(
    usuario: string,
    contraseña: string
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      {
        usuario,
        contraseña
      }
    );

  }

}

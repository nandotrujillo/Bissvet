import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MascotasService {

  private apiUrl = 'http://localhost:3000/api/mascotas';

  constructor(private http: HttpClient) { }


  // ==========================================
  // LISTAR
  // ==========================================

  listar(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl
    );

  }


  // ==========================================
  // OBTENER POR ID
  // ==========================================

  obtener(IdMascota: number): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${IdMascota}`
    );

  }


  // ==========================================
  // CREAR
  // ==========================================

  crear(mascota: any): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      mascota
    );

  }


  // ==========================================
  // ACTUALIZAR
  // ==========================================

  actualizar(
    IdMascota: number,
    mascota: any
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${IdMascota}`,
      mascota
    );

  }


  // ==========================================
  // ELIMINAR
  // ==========================================

  eliminar(IdMascota: number): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${IdMascota}`
    );

  }

}
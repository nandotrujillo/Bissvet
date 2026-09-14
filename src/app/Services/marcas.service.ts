import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarcasService {

  private apiUrl = `${environment.apiUrl}/marcas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  crear(marca: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, marca);
  }

  actualizar(id: number, marca: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, marca);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

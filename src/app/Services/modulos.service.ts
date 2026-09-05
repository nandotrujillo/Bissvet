import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Modulo } from '../Models/modulo';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {

  private apiUrl =
    `${environment.apiUrl}/modulos`;

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

}
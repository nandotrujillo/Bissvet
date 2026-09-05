import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private apiUrl = `${environment.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  obtenerJornadas(opciones: {
    desde?: string;
    hasta?: string;
    estado?: string;
  } = {}): Observable<{ ok: boolean; datos: any[] }> {
    const params: string[] = [];
    if (opciones.desde) params.push(`desde=${opciones.desde}`);
    if (opciones.hasta) params.push(`hasta=${opciones.hasta}`);
    if (opciones.estado) params.push(`estado=${opciones.estado}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.http.get<{ ok: boolean; datos: any[] }>(`${this.apiUrl}${qs}`);
  }

  obtenerTipos(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(`${this.apiUrl}/tipos`);
  }

  obtenerMovimientos(idJornada: number): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(
      `${this.apiUrl}/${idJornada}/movimientos`
    );
  }

  obtenerArqueo(desde: string, hasta: string): Observable<{ ok: boolean; datos: any }> {
    return this.http.get<{ ok: boolean; datos: any }>(
      `${this.apiUrl}/arqueo?desde=${desde}&hasta=${hasta}`
    );
  }

  abrirCaja(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/apertura`, payload);
  }

  cerrarCaja(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cierre`, payload);
  }

  registrarMovimiento(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/movimiento`, payload);
  }
}

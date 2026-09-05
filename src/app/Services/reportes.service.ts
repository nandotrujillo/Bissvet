import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  obtenerCatalogo(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(`${this.apiUrl}/catalogo`);
  }

  obtenerReporte(opciones: {
    id: string;
    desde?: string;
    hasta?: string;
    producto?: number | null;
    estado?: string;
  }): Observable<{ ok: boolean; datos: any[]; total: number }> {
    const params: string[] = [];
    if (opciones.desde) params.push(`desde=${opciones.desde}`);
    if (opciones.hasta) params.push(`hasta=${opciones.hasta}`);
    if (opciones.producto) params.push(`producto=${opciones.producto}`);
    if (opciones.estado) params.push(`estado=${encodeURIComponent(opciones.estado)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.http.get<{ ok: boolean; datos: any[]; total: number }>(
      `${this.apiUrl}/${opciones.id}${qs}`
    );
  }

  exportarCSV(opciones: {
    id: string;
    desde?: string;
    hasta?: string;
    producto?: number | null;
    estado?: string;
  }): string {
    const params: string[] = [];
    if (opciones.desde) params.push(`desde=${opciones.desde}`);
    if (opciones.hasta) params.push(`hasta=${opciones.hasta}`);
    if (opciones.producto) params.push(`producto=${opciones.producto}`);
    if (opciones.estado) params.push(`estado=${encodeURIComponent(opciones.estado)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${this.apiUrl}/${opciones.id}/exportar${qs}`;
  }

  imprimirPDF(opciones: {
    id: string;
    desde?: string;
    hasta?: string;
    producto?: number | null;
    estado?: string;
  }): string {
    const params: string[] = [];
    if (opciones.desde) params.push(`desde=${opciones.desde}`);
    if (opciones.hasta) params.push(`hasta=${opciones.hasta}`);
    if (opciones.producto) params.push(`producto=${opciones.producto}`);
    if (opciones.estado) params.push(`estado=${encodeURIComponent(opciones.estado)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${this.apiUrl}/${opciones.id}/imprimir${qs}`;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface ModuloSistema {
  idModulos: number;
  Codigo: string;
  NombreModulo: string;
  Ruta?: string;
  Icono?: string;
  Orden?: number;
  Descripcion?: string;
}

export interface RolSistema {
  IdRol: number;
  IdEmpresa: number | null;
  Nombre: string;
  Descripcion?: string;
  Activo: number;
}

@Injectable({
  providedIn: 'root'
})
export class SeguridadService {

  private apiUrl = 'http://localhost:3000/api/seguridad';

  private modulosCache: ModuloSistema[] | null = null;
  private permisosCache: string[] | null = null;

  constructor(private http: HttpClient) {}

  obtenerMenu(): Observable<{ ok: boolean; datos: ModuloSistema[] }> {
    if (this.modulosCache) {
      return of({ ok: true, datos: this.modulosCache });
    }

    return this.http.get<{ ok: boolean; datos: ModuloSistema[] }>(
      `${this.apiUrl}/mi-menu`
    );
  }

  obtenerMisPermisos(): Observable<{ ok: boolean; datos: string[] }> {
    if (this.permisosCache) {
      return of({ ok: true, datos: this.permisosCache });
    }

    return this.http.get<{ ok: boolean; datos: string[] }>(
      `${this.apiUrl}/mis-permisos`
    );
  }

  tienePermiso(codigo: string): boolean {
    return (
      !!this.permisosCache &&
      this.permisosCache.includes(codigo)
    );
  }

  limpiarCache(): void {
    this.modulosCache = null;
    this.permisosCache = null;
  }

  obtenerPerfiles(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(
      `${this.apiUrl}/perfiles`
    );
  }

  obtenerRoles(): Observable<{ ok: boolean; datos: RolSistema[] }> {
    return this.http.get<{ ok: boolean; datos: RolSistema[] }>(
      `${this.apiUrl}/roles`
    );
  }

  crearRol(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/roles`, payload);
  }

  obtenerModulos(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(
      `${this.apiUrl}/modulos`
    );
  }

  obtenerPermisos(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(
      `${this.apiUrl}/permisos`
    );
  }

  obtenerRolPermisos(idRol: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rolpermisos/${idRol}`);
  }

  asignarRolPermisos(idRol: number, permisos: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/rolpermisos/${idRol}`, { permisos });
  }

  obtenerRolesUsuario(usuarioId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarioroles/${usuarioId}`);
  }

  asignarRolesUsuario(usuarioId: number, roles: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarioroles/${usuarioId}`, { roles });
  }

  obtenerSesiones(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(
      `${this.apiUrl}/sesiones`
    );
  }

  obtenerAuditoria(): Observable<{ ok: boolean; datos: any[] }> {
    return this.http.get<{ ok: boolean; datos: any[] }>(
      `${this.apiUrl}/auditoria`
    );
  }
}
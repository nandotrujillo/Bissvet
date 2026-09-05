import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('token')
        : null;

    let request = req;

    // No adjuntar token al login público
    const esLogin =
      req.url.includes('/api/usuarios/login');

    if (token && !esLogin) {
      request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        if (
          error.status === 401 &&
          !req.url.includes('/api/usuarios/login')
        ) {

          // Token inválido o expirado: limpiar sesión
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            localStorage.removeItem('UsuarioId');
            localStorage.removeItem('IdEmpresa');
            localStorage.removeItem('empresa');
          }

          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
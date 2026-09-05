import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const tieneSesion =
    typeof localStorage !== 'undefined' &&
    !!localStorage.getItem('token') &&
    !!localStorage.getItem('usuario');

  if (tieneSesion) {
    return true;
  }

  console.log(
    'Acceso denegado. Usuario no autenticado.'
  );

  return router.createUrlTree(['/login']);
};
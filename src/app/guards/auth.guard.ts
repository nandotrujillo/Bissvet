import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const autenticado =
    typeof localStorage !== 'undefined' &&
    !!localStorage.getItem('usuario');

  if (autenticado) {

    return true;

  }

  console.log(
    'Acceso denegado. Usuario no autenticado.'
  );

  return router.createUrlTree(['/login']);
};
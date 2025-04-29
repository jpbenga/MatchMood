// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { map, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1), // Prend la première valeur émise (état actuel) et se désinscrit
    map(user => !!user), // Convertit l'objet User ou null en boolean
    tap(isLoggedIn => {
      if (!isLoggedIn) {
        // Redirige vers la page de login si non connecté
        router.navigateByUrl('/login', { replaceUrl: true });
      }
    })
  );
};
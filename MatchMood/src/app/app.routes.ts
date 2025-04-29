// src/app/app.routes.ts (Exemple de structure pour standalone)
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'; // Importez le guard

export const routes: Routes = [
  {
    path: 'home', // Votre page principale/d'accueil
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard] // Appliquez le guard ici
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
    // Pas de guard ici
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.page').then( m => m.SignupPage)
    // Pas de guard ici
  },
  {
    path: '',
    redirectTo: 'home', // Redirige la racine vers home (le guard s'appliquera)
    pathMatch: 'full'
  },
  // Ajoutez d'autres routes ici...
];
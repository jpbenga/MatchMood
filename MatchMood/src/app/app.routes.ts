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
  {
    path: 'find-friends',
    loadComponent: () => import('./pages/find-friends/find-friends.page').then( m => m.FindFriendsPage)
  },
  {
    path: 'friend-requests',
    loadComponent: () => import('./pages/friend-requests/friend-requests.page').then( m => m.FriendRequestsPage)
  },
  {
    path: 'friend-list',
    loadComponent: () => import('./pages/friend-list/friend-list.page').then( m => m.FriendListPage)
  },
  // Ajoutez d'autres routes ici...
];
// src/app/services/auth/auth.service.ts

import { Injectable, inject, Injector } from '@angular/core'; // Injector ajouté
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  AuthError,
  sendEmailVerification
} from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserService } from '../user/user.service'; // Garder l'import pour le type

export interface Credentials {
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userAuthState = new BehaviorSubject<FirebaseUser | null>(null);
  user$ = this.userAuthState.asObservable();
  currentUser: FirebaseUser | null = null;

  // Supprimer l'injection directe de UserService
  // private userService = inject(UserService);
  // Injecter Injector à la place
  private injector = inject(Injector);

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.userAuthState.next(user);
    });
  }

  async registerWithEmail(credentials: Required<Credentials>): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      if (userCredential.user) {
        // Obtenir UserService via l'Injector SEULEMENT ici
        const userService = this.injector.get(UserService);
        await userService.createUserProfile(userCredential.user);
        await this.sendVerificationEmail(userCredential.user);
      } else {
         throw new Error("Utilisateur Firebase non retourné après l'inscription.");
      }
      return userCredential;
    } catch (e) {
      this.handleAuthError(e);
    }
  }

  async loginWithEmail(credentials: Required<Credentials>): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      return userCredential;
    } catch (e) {
      this.handleAuthError(e);
    }
  }

  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(this.auth, provider);
      if (userCredential.user) {
         // Obtenir UserService via l'Injector SEULEMENT ici aussi
         const userService = this.injector.get(UserService);
        await userService.createUserProfile(userCredential.user);
      } else {
        throw new Error("Utilisateur Firebase non retourné après la connexion Google.");
      }
      return userCredential;
    } catch (e) {
      this.handleAuthError(e);
    }
  }

  async sendVerificationEmail(user: FirebaseUser): Promise<void> {
      try {
          await sendEmailVerification(user);
      } catch (error) {
          console.error("Erreur lors de l'envoi de l'email de vérification:", error);
      }
  }


  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (e) {
      console.error("Erreur lors de la déconnexion:", e);
      throw e;
    }
  }

  async loginWithPhone(phoneNumber: string, recaptchaVerifier: any): Promise<any> {
     console.warn("loginWithPhone non implémenté.", phoneNumber, recaptchaVerifier);
     throw new Error("Fonctionnalité téléphone non implémentée");
   }

  async verifyOtp(confirmationResult: any, otpCode: string): Promise<UserCredential> {
    console.warn("verifyOtp non implémenté.", confirmationResult, otpCode);
    throw new Error("Fonctionnalité téléphone non implémentée");
  }

  private handleAuthError(error: any): never {
    const firebaseError = error as AuthError;
    console.error("Erreur Firebase Auth:", firebaseError.code, firebaseError.message);
    let friendlyMessage = "Une erreur d'authentification est survenue.";
    switch (firebaseError.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        friendlyMessage = "Email ou mot de passe incorrect.";
        break;
      case 'auth/email-already-in-use':
        friendlyMessage = "Cette adresse email est déjà utilisée.";
        break;
      case 'auth/weak-password':
        friendlyMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        break;
      case 'auth/invalid-email':
        friendlyMessage = "L'adresse email n'est pas valide.";
        break;
      case 'auth/popup-closed-by-user':
        friendlyMessage = "La fenêtre de connexion a été fermée.";
        break;
      case 'auth/account-exists-with-different-credential':
        friendlyMessage = "Un compte existe déjà avec une autre méthode de connexion pour cet email.";
        break;
    }
    throw new Error(friendlyMessage);
  }
}
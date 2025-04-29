// src/app/services/auth/auth.service.ts
// (Seule la méthode loginWithGoogle est montrée, le reste du fichier est inchangé)
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider, // Gardez cet import
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  AuthError,
  sendEmailVerification // Import pour la vérification email
} from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserService } from '../user/user.service';

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

  private userService = inject(UserService);

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
        await this.userService.createUserProfile(userCredential.user);
        // Envoyer l'email de vérification après création du profil
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
      // Ajouter cette ligne pour forcer la sélection de compte
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(this.auth, provider);
      if (userCredential.user) {
        await this.userService.createUserProfile(userCredential.user);
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
          // Gérer l'erreur (ex: afficher un message) mais ne pas bloquer le flux principal
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
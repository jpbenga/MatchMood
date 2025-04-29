// src/app/services/user/user.service.ts

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
  docData,
  DocumentReference
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User as FirebaseUser } from '@angular/fire/auth'; // Alias pour éviter conflit
import { User } from '../../models/user.model'; // Notre interface User

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  async createUserProfile(firebaseUser: FirebaseUser): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur', // Valeur par défaut
      photoURL: firebaseUser.photoURL || null, // Peut être null initialement
      createdAt: serverTimestamp(), // Utilise le timestamp du serveur Firestore
      friendIds: [], // Initialiser les listes vides
      groupIds: []
    };

    try {
      await setDoc(userDocRef, userData);
    } catch (error) {
      console.error("Erreur lors de la création du profil utilisateur:", error);
      throw error; // Propage l'erreur pour une gestion ultérieure
    }
  }

  getUserProfile(uid: string): Observable<User | undefined> {
    const userDocRef = doc(this.firestore, `users/${uid}`) as DocumentReference<User>;
    return docData<User>(userDocRef, { idField: 'uid' }); // idField n'est utile que si uid n'est pas le nom du champ, mais on le garde pour la cohérence
  }

  // Ajoutez ici d'autres méthodes pour mettre à jour le profil, etc.
}
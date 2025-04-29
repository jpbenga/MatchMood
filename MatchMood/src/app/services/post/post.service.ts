// src/app/services/post/post.service.ts

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  collectionData,
  query,
  orderBy,
  limit,
  Timestamp,
  FieldValue,
  doc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Post } from '../../models/post.model';
import { AuthService } from '../auth/auth.service';

export type NewPostData = Omit<Post, 'id' | 'createdAt' | 'userId'> & {
  filePath?: string | null;
};


@Injectable({
  providedIn: 'root'
})
export class PostService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  constructor() { }

  async addPost(postData: NewPostData): Promise<string | null> {
    const user = this.authService.currentUser;
    if (!user) {
      console.error("Utilisateur non connecté, impossible de poster.");
      throw new Error("Utilisateur non connecté.");
    }

    try {
      const postsCollection = collection(this.firestore, 'posts');
      // Construire l'objet dataToSave sans inclure les clés potentiellement undefined
      const dataToSave: { [key: string]: any } = { // Utiliser un type plus flexible temporairement
        userId: user.uid,
        type: postData.type,
        mediaUrl: postData.mediaUrl || null,
        filePath: postData.filePath || null,
        textContent: postData.textContent || null,
        createdAt: serverTimestamp()
      };

      // Ajouter conditionnellement associatedMatchId seulement s'il est défini
      if (postData.associatedMatchId) {
        dataToSave['associatedMatchId'] = postData.associatedMatchId;
      }

      // Typescript est maintenant satisfait car on n'assigne plus undefined explicitement
      // addDoc accepte l'objet même s'il ne correspond pas parfaitement à Omit<Post, 'id'>
      // tant que les valeurs sont des types supportés par Firestore.
      const docRef = await addDoc(postsCollection, dataToSave as Omit<Post, 'id'>); // On peut re-caster si besoin, mais addDoc est flexible
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout du post:", error);
      throw error;
    }
  }

  getRecentPosts(count: number = 20): Observable<Post[]> {
    const postsCollection = collection(this.firestore, 'posts');
    const q = query(postsCollection, orderBy('createdAt', 'desc'), limit(count));
    return collectionData(q, { idField: 'id' }) as Observable<Post[]>;
  }

  async deletePost(postId: string): Promise<void> {
     const user = this.authService.currentUser;
     if (!user) {
       throw new Error("Utilisateur non connecté.");
     }
     try {
         const postDocRef = doc(this.firestore, `posts/${postId}`);
         await deleteDoc(postDocRef);
     } catch (error) {
         console.error("Erreur lors de la suppression du post:", error);
         throw error;
     }
  }
}
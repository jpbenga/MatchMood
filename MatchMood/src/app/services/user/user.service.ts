import { Injectable, inject } from '@angular/core';
import {
  Firestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
  serverTimestamp, docData, collection, query, where, getDocs,
  Timestamp, FieldValue, DocumentReference, DocumentSnapshot, collectionData,
  addDoc, limit, deleteDoc, writeBatch, orderBy
} from '@angular/fire/firestore';
import { Observable, of, forkJoin, from } from 'rxjs';
import { map, switchMap, filter, take, tap } from 'rxjs/operators';
import { User as FirebaseUser } from '@angular/fire/auth';
import { User } from '../../models/user.model';
import { FriendRequest } from '../../models/friend-request.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  constructor() { }

  async createUserProfile(firebaseUser: FirebaseUser): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const baseUserData: Partial<User> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur',
      photoURL: firebaseUser.photoURL || null,
      createdAt: serverTimestamp()
    };
    try {
      await setDoc(userDocRef, baseUserData, { merge: true });
    } catch (error) {
      console.error("Erreur lors de la création/mise à jour du profil utilisateur:", error);
      throw error;
    }
  }

  getUserProfile(uid: string): Observable<User | undefined> {
    const userDocRef = doc(this.firestore, `users/${uid}`) as DocumentReference<User>;
    return docData<User>(userDocRef);
  }

  async getFriendIds(userId: string): Promise<string[] | undefined> {
      try {
          const userDocRef = doc(this.firestore, `users/${userId}`);
          const docSnap: DocumentSnapshot<User> = await getDoc(userDocRef as DocumentReference<User>);
          if (docSnap.exists()) {
              return docSnap.data()?.friendIds || [];
          } else {
              return undefined;
          }
      } catch(error) {
          console.error("Erreur lors de la récupération des friendIds:", error);
          throw error;
      }
  }

  getFriends(): Observable<User[]> {
    return this.authService.user$.pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) {
          return of([]);
        }
        const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`) as DocumentReference<User>;
        return from(getDoc(userDocRef)).pipe(
            map(docSnap => docSnap.data()?.friendIds || []),
            switchMap(friendIds => {
                if (friendIds.length === 0) {
                    return of([]);
                }
                const friendProfileObservables = friendIds.map(friendId =>
                    this.getUserProfile(friendId).pipe(
                        filter(p => p !== undefined),
                        take(1)
                    )
                );
                return friendProfileObservables.length > 0 ?
                       forkJoin(friendProfileObservables).pipe(map(profiles => profiles as User[])) :
                       of([]);
            })
        );
      })
    );
  }


  async searchUsersByEmail(email: string): Promise<User[]> {
    const currentUserId = this.authService.currentUser?.uid;
    if (!email || !currentUserId) return [];
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where("email", "==", email.toLowerCase()), limit(5));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
          if (doc.id !== currentUserId) {
              users.push({ uid: doc.id, ...doc.data() } as User);
          }
      });
      return users;
    } catch (error) {
      console.error("Erreur recherche utilisateurs:", error);
      throw error;
    }
  }

  async sendFriendRequest(receiverId: string): Promise<void> {
    const senderId = this.authService.currentUser?.uid;
    if (!senderId || senderId === receiverId) {
      throw new Error("Impossible d'envoyer une demande à soi-même ou utilisateur non connecté.");
    }
    try {
      const requestsRef = collection(this.firestore, 'friendRequests');
      const requestDocRef = doc(requestsRef, `${senderId}_${receiverId}`);
      const requestData: Omit<FriendRequest, 'id'> = {
          senderId: senderId,
          receiverId: receiverId,
          status: 'pending',
          createdAt: serverTimestamp()
      };
      await setDoc(requestDocRef, requestData);
    } catch (error) {
      console.error("Erreur envoi demande d'ami:", error);
      throw error;
    }
  }

  getPendingFriendRequests(): Observable<FriendRequest[]> {
      const currentUserId = this.authService.currentUser?.uid;
      if (!currentUserId) {
          return of([]);
      }
      const requestsRef = collection(this.firestore, 'friendRequests');
      const q = query(
          requestsRef,
          where("receiverId", "==", currentUserId),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
      );
      return collectionData(q, { idField: 'id' }) as Observable<FriendRequest[]>;
  }

  async acceptFriendRequest(request: FriendRequest): Promise<void> {
      if (!request.id || !request.senderId || !request.receiverId) {
           throw new Error("Données de requête invalides.");
      }
      const batch = writeBatch(this.firestore);
      const requestDocRef = doc(this.firestore, `friendRequests/${request.id}`);
      batch.update(requestDocRef, { status: 'accepted' });
      const senderDocRef = doc(this.firestore, `users/${request.senderId}`);
      batch.update(senderDocRef, { friendIds: arrayUnion(request.receiverId) });
      const receiverDocRef = doc(this.firestore, `users/${request.receiverId}`);
      batch.update(receiverDocRef, { friendIds: arrayUnion(request.senderId) });
      try {
          await batch.commit();
      } catch(error) {
          console.error("Erreur acceptation demande:", error);
          throw error;
      }
  }

  async declineOrCancelFriendRequest(requestId: string): Promise<void> {
       if (!requestId) {
           throw new Error("ID de requête invalide.");
       }
       const requestDocRef = doc(this.firestore, `friendRequests/${requestId}`);
       try {
           await deleteDoc(requestDocRef);
       } catch(error) {
           console.error("Erreur refus/annulation demande:", error);
           throw error;
       }
  }

  async removeFriend(friendId: string): Promise<void> {
      const currentUserId = this.authService.currentUser?.uid;
      if (!currentUserId || !friendId) {
          throw new Error("Utilisateur non connecté ou ID ami manquant.");
      }
      const currentUserDocRef = doc(this.firestore, `users/${currentUserId}`);
      const friendDocRef = doc(this.firestore, `users/${friendId}`);
      const batch = writeBatch(this.firestore);
      batch.update(currentUserDocRef, { friendIds: arrayRemove(friendId) });
      batch.update(friendDocRef, { friendIds: arrayRemove(currentUserId) });
      try {
          await batch.commit();
      } catch(error) {
          console.error("Erreur lors de la suppression d'ami:", error);
          throw error;
      }
  }
}
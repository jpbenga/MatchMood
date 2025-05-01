import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, forkJoin } from 'rxjs'; // Ajout of, forkJoin
import { switchMap, map, take } from 'rxjs/operators'; // Ajout switchMap, map, take
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonIcon, IonSpinner, IonButtons, IonBackButton,
    ToastController, LoadingController, IonAvatar, IonImg // Ajout IonAvatar, IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';

import { UserService } from '../../services/user/user.service';
import { FriendRequest } from '../../models/friend-request.model';
import { User } from '../../models/user.model'; // Importer User
import { Timestamp } from 'firebase/firestore';

// Interface pour les données enrichies
interface EnrichedFriendRequest extends FriendRequest {
    senderDisplayName?: string;
    senderPhotoURL?: string | null;
}

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.page.html',
  styleUrls: ['./friend-requests.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonIcon, IonSpinner, IonButtons, IonBackButton,
    IonAvatar, IonImg, // Ajout IonAvatar, IonImg
    CommonModule,
    FormsModule
  ]
})
export class FriendRequestsPage implements OnInit {

  // L'observable contiendra maintenant les requêtes enrichies
  requests$!: Observable<EnrichedFriendRequest[]>;

  private userService = inject(UserService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  constructor() {
     addIcons({ checkmarkCircleOutline, closeCircleOutline });
   }

  ngOnInit() {
    this.requests$ = this.userService.getPendingFriendRequests().pipe(
      switchMap(requests => {
        if (requests.length === 0) {
          return of([]); // Retourne un observable de tableau vide
        }
        // Crée un tableau d'observables, chacun récupérant un profil utilisateur
        const userProfileObservables: Observable<User | undefined>[] = requests.map(req =>
          this.userService.getUserProfile(req.senderId).pipe(take(1)) // Prend la première valeur émise
        );
        // Utilise forkJoin pour attendre que tous les profils soient récupérés
        return forkJoin(userProfileObservables).pipe(
          map(profiles => {
            // Combine les requêtes originales avec les profils récupérés
            return requests.map((req, index) => {
              const profile = profiles[index];
              return {
                ...req, // Copie les propriétés de la requête originale
                senderDisplayName: profile?.displayName || req.senderId, // Utilise le nom ou l'ID par défaut
                senderPhotoURL: profile?.photoURL || null // Ajoute l'URL photo
              };
            });
          })
        );
      })
    );
  }

  getJsDate(timestamp: any): Date | null {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return null;
  }

  async acceptRequest(request: FriendRequest) {
      const loading = await this.loadingCtrl.create();
      await loading.present();
      try {
          await this.userService.acceptFriendRequest(request);
          await this.presentToast('Demande acceptée !', 'success');
      } catch(error: any) {
          console.error("Erreur acceptation:", error);
          await this.presentToast(error.message || "Erreur lors de l'acceptation.", 'danger');
      } finally {
          await loading.dismiss();
      }
  }

  async declineRequest(requestId: string) {
      const loading = await this.loadingCtrl.create();
      await loading.present();
      try {
          await this.userService.declineOrCancelFriendRequest(requestId);
          await this.presentToast('Demande refusée.', 'medium');
      } catch(error: any) {
          console.error("Erreur refus:", error);
          await this.presentToast(error.message || "Erreur lors du refus.", 'danger');
      } finally {
          await loading.dismiss();
      }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'medium' = 'danger') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}
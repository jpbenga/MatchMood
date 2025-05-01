import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonAvatar, IonImg, IonButton, IonIcon, IonSpinner,
  IonButtons, IonBackButton, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personRemoveOutline } from 'ionicons/icons';

import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user.model';
import { Timestamp } from 'firebase/firestore'; // Garder l'import pour le type dans User

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.page.html',
  styleUrls: ['./friend-list.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonAvatar, IonImg, IonButton, IonIcon, IonSpinner,
    IonButtons, IonBackButton,
    CommonModule,
    FormsModule
    ]
})
export class FriendListPage implements OnInit {

  friends$!: Observable<User[]>;

  private userService = inject(UserService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ personRemoveOutline });
  }

  ngOnInit() {
    this.friends$ = this.userService.getFriends();
  }

  async confirmRemoveFriend(friend: User) {
    if (!friend.uid) return;
    const alert = await this.alertCtrl.create({
        header: 'Retirer ami',
        message: `Voulez-vous vraiment retirer ${friend.displayName || 'cet utilisateur'} de vos amis ?`,
        buttons: [
            { text: 'Annuler', role: 'cancel' },
            {
                text: 'Retirer',
                role: 'confirm',
                handler: async () => {
                    await this.removeFriend(friend.uid);
                }
            }
        ]
    });
    await alert.present();
  }

  private async removeFriend(friendId: string) {
    try {
        await this.userService.removeFriend(friendId);
        await this.presentToast('Ami retiré.', 'success');
    } catch(error: any) {
        console.error("Erreur suppression ami:", error);
        await this.presentToast(error.message || 'Erreur lors de la suppression.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' = 'danger') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

}
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Ajout pour ngModel si utilisé
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList,
  IonItem, IonLabel, IonAvatar, IonImg, IonButton, IonIcon, IonSpinner,
  IonButtons, IonBackButton, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';

import { UserService } from '../../services/user/user.service'; // Importer UserService
import { User } from '../../models/user.model'; // Importer le modèle User


@Component({
  selector: 'app-find-friends',
  templateUrl: './find-friends.page.html',
  styleUrls: ['./find-friends.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList,
    IonItem, IonLabel, IonAvatar, IonImg, IonButton, IonIcon, IonSpinner,
    IonButtons, IonBackButton,
    CommonModule,
    FormsModule // Ajout pour ngModel si utilisé
  ]
})
export class FindFriendsPage implements OnInit {

  isLoading = false;
  searchResults: User[] = [];
  searchPerformed = false; // Pour savoir si une recherche a été lancée

  private userService = inject(UserService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController); // Optionnel pour l'ajout

  constructor() {
    addIcons({ personAddOutline });
  }

  ngOnInit() {
  }

  async handleSearchInput(event: any) {
    const searchTerm = event.target.value?.trim().toLowerCase();

    if (!searchTerm || searchTerm.length < 3) { // Évite recherche sur terme trop court
      this.searchResults = [];
      this.searchPerformed = false;
      return;
    }

    this.isLoading = true;
    this.searchPerformed = true;
    this.searchResults = [];

    try {
      // Pour l'instant, recherche par email exact
      this.searchResults = await this.userService.searchUsersByEmail(searchTerm);
    } catch (error: any) {
      console.error("Erreur recherche:", error);
      await this.presentToast("Erreur lors de la recherche.", 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async sendRequest(receiverId: string) {
      if (!receiverId) return;

      const loading = await this.loadingCtrl.create({ message: 'Envoi...' });
      await loading.present();

      try {
          await this.userService.sendFriendRequest(receiverId);
          await loading.dismiss();
          await this.presentToast("Demande d'ami envoyée !", 'success');
          // Optionnel: Mettre à jour l'UI pour cet utilisateur (ex: désactiver bouton)
      } catch (error: any) {
          await loading.dismiss();
          console.error("Erreur envoi demande:", error);
          await this.presentToast(error.message || "Erreur lors de l'envoi.", 'danger');
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
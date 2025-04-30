// src/app/services/notification/notification.service.ts

import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private router = inject(Router);

  constructor() { }

  public initPushNotifications(): void {
    if (Capacitor.getPlatform() !== 'web') {
      this.registerPush();
    } else {
      console.log("Push notifications non initialisées (plateforme web détectée).");
    }
  }

  private registerPush(): void {
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        console.warn('Permission pour les notifications refusée.');
      }
    }).catch(err => console.error("Erreur demande permission:", err));

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      // TODO: Envoyer ce token à votre backend/Firestore pour le stocker
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push received: ' + JSON.stringify(notification));
      }
    );

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        // const data = notification.notification.data;
        // if (data.detailsId) {
        //   this.router.navigateByUrl(`/posts/${data.detailsId}`);
        // }
      }
    );
  }
}
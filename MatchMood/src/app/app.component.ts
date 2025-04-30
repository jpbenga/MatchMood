// src/app/app.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NotificationService } from './services/notification/notification.service'; // Assurez chemin correct

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule, RouterOutlet], // Ajuster si besoin
})
export class AppComponent {
  private notificationService = inject(NotificationService);

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    this.notificationService.initPushNotifications();
  }
}
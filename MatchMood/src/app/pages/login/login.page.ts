import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonButton,
  IonSpinner,
  IonIcon, // Ajout pour l'icône Google
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Nécessaire pour les icônes
import { logoGoogle } from 'ionicons/icons'; // Importer l'icône spécifique

import { AuthService, Credentials } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonButton,
    IonSpinner,
    IonIcon, // Ajouter IonIcon aux imports
    CommonModule,
    ReactiveFormsModule
  ]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  isLoadingGoogle = false; // Indicateur séparé pour Google

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  constructor() {
      addIcons({ logoGoogle }); // Rendre l'icône Google disponible
  }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.isLoadingGoogle = false; // Assurer que l'autre spinner est caché

    const credentials: Required<Credentials> = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
    };

    try {
      await this.authService.loginWithEmail(credentials);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      console.error("Erreur de connexion email:", error);
      await this.presentToast(error.message || "Erreur lors de la connexion.");
    } finally {
      this.isLoading = false;
    }
  }

  async googleLogin() {
      this.isLoadingGoogle = true;
      this.isLoading = false; // Assurer que l'autre spinner est caché

      try {
          await this.authService.loginWithGoogle();
          this.router.navigateByUrl('/home', { replaceUrl: true });
      } catch (error: any) {
          console.error("Erreur de connexion Google:", error);
          await this.presentToast(error.message || "Erreur lors de la connexion Google.");
      } finally {
          this.isLoadingGoogle = false;
      }
  }


  goToSignup() {
    this.router.navigate(['/signup']);
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
}
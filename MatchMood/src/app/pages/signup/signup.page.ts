import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
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
  IonButtons,
  IonBackButton,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';

import { AuthService, Credentials } from '../../services/auth/auth.service';

// Custom validator function
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}


@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
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
    IonButtons,
    IonBackButton,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class SignupPage implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  ngOnInit() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatchValidator }); // Add custom validator at the group level
  }

  async signup() {
    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;

    const credentials: Required<Credentials> = {
        email: this.signupForm.value.email,
        password: this.signupForm.value.password
    };

    try {
      await this.authService.registerWithEmail(credentials);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      await this.presentToast(error.message || "Erreur lors de l'inscription.");
    } finally {
      this.isLoading = false;
    }
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
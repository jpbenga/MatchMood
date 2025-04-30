// src/main.ts (ou src/app/app.config.ts)

import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Assurez-vous que la config Firebase est correcte (idéalement via environment)
const firebaseConfig = {
    projectId: "matchmood-24471",
    appId: "1:188280949578:web:56344bd563a37676a98fb3",
    storageBucket: "matchmood-24471.appspot.com", // Corrigé: pas .firebasestorage.app
    apiKey: "AIzaSyANYCD4YCAkkD5Zg2hnGu-jzL7j-ondv6g", // !! Attention si c'est une vraie clé
    authDomain: "matchmood-24471.firebaseapp.com",
    messagingSenderId: "188280949578",
    // measurementId: "G-PL0ETHVFPE" // Measurement ID est pour Analytics, pas essentiel ici
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions()), // Gardé si utilisé
    provideMessaging(() => getMessaging()), // Gardé si utilisé
    MediaCapture // Provider pour le plugin Cordova
  ],
}).then(() => {
   defineCustomElements(window);
}).catch(err => console.error(err));
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

// Import pour Awesome Cordova Plugins
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';

// Import pour PWA Elements (gardez-le)
import { defineCustomElements } from '@ionic/pwa-elements/loader';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp({ projectId: "matchmood-24471", appId: "1:188280949578:web:56344bd563a37676a98fb3", storageBucket: "matchmood-24471.firebasestorage.app", apiKey: "AIzaSyANYCD4YCAkkD5Zg2hnGu-jzL7j-ondv6g", authDomain: "matchmood-24471.firebaseapp.com", messagingSenderId: "188280949578", measurementId: "G-PL0ETHVFPE" })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()),
    MediaCapture // <-- Provider ajouté ici
  ],
}).then(() => {
   defineCustomElements(window);
}).catch(err => console.error(err));
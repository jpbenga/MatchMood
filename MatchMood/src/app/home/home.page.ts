import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Ajout pour ngModel
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonImg, IonList, IonItem, IonLabel, IonSpinner, IonTextarea, // Ajout IonTextarea
  ToastController, LoadingController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, cameraOutline, videocamOutline, trashOutline, sendOutline } from 'ionicons/icons'; // Ajout sendOutline
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { PhotoService, UploadResult } from '../services/photo/photo.service';
import { PostService, NewPostData } from '../services/post/post.service';
import { Post } from '../models/post.model';
import { Photo } from '@capacitor/camera';
import { MediaFile } from '@awesome-cordova-plugins/media-capture/ngx';
import { Timestamp } from 'firebase/firestore';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonImg, IonList, IonItem, IonLabel, IonSpinner, IonTextarea, // Ajout IonTextarea
    CommonModule,
    FormsModule // Ajout FormsModule
  ],
})
export class HomePage implements OnInit {
  capturedImage: string | null = null;
  isUploading = false;
  isLoadingVibe = false; // Spécifique pour le chargement des vibes
  posts$!: Observable<Post[]>;
  vibeText: string = ''; // Pour lier au textarea

  public authService = inject(AuthService);
  private router = inject(Router);
  private photoService = inject(PhotoService);
  private postService = inject(PostService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({ logOutOutline, cameraOutline, videocamOutline, trashOutline, sendOutline }); // Ajout sendOutline
  }

  ngOnInit() {
    this.posts$ = this.postService.getRecentPosts();
  }

  getJsDate(timestamp: any): Date | null {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return null;
  }

  // Nouvelle méthode pour envoyer une vibe
  async sendVibe() {
      if (!this.vibeText || !this.vibeText.trim()) {
          return; // Ne rien envoyer si le texte est vide
      }
      this.isLoadingVibe = true; // Utiliser un indicateur séparé
      const loading = await this.loadingCtrl.create({ message: 'Envoi de la vibe...' });
      await loading.present();

      const postData: NewPostData = {
          type: 'vibe',
          textContent: this.vibeText.trim(), // Enlever les espaces superflus
          mediaUrl: null,
          filePath: null
          // associatedMatchId: 'ID_DU_MATCH_ACTUEL' // À ajouter plus tard
      };

      try {
          const postId = await this.postService.addPost(postData);
          await loading.dismiss();
          this.isLoadingVibe = false;

          if (postId) {
              console.log('Post vibe créé avec ID:', postId);
              this.vibeText = ''; // Vider le champ après succès
              await this.presentToast('Vibe envoyée !', 'success');
          } else {
              throw new Error("La création du post vibe n'a pas retourné d'ID.");
          }
      } catch (error: any) {
          await loading.dismiss();
          this.isLoadingVibe = false;
          console.error("Erreur lors de l'envoi de la vibe:", error);
          await this.presentToast(error.message || "Erreur lors de l'envoi.", 'danger');
      }
  }


  async capturePhoto() {
    const photo = await this.photoService.takePicture();
    if (photo && photo.webPath) {
      this.capturedImage = photo.webPath;
      await this.uploadPhotoAndCreatePost(photo);
    } else {
      this.capturedImage = null;
    }
  }

  async uploadPhotoAndCreatePost(photo: Photo) {
    this.isUploading = true;
    this.isLoadingVibe = false;
    const loading = await this.loadingCtrl.create({ message: 'Publication photo...' });
    await loading.present();
    let uploadResult: UploadResult | null = null;

    try {
      uploadResult = await this.photoService.uploadPhoto(photo);

      if (!uploadResult || !uploadResult.downloadUrl || !uploadResult.filePath) {
         throw new Error("L'upload photo n'a pas retourné les informations nécessaires.");
      }

      const postData: NewPostData = {
        type: 'photo',
        mediaUrl: uploadResult.downloadUrl,
        filePath: uploadResult.filePath,
        textContent: null
      };
      const postId = await this.postService.addPost(postData);
      await loading.dismiss();
      this.isUploading = false;
      this.capturedImage = null;

      if (postId) {
          await this.presentToast('Photo publiée avec succès !', 'success');
      } else {
          throw new Error("La création du post photo n'a pas retourné d'ID.");
      }

    } catch (error: any) {
      await loading.dismiss();
      this.isUploading = false;
      console.error("Erreur lors de la publication photo:", error);
      await this.presentToast(error.message || "Erreur lors de la publication photo.", 'danger');
    }
  }

  async captureVideo() {
      const mediaFile = await this.photoService.recordShortVideo(6);
      if (mediaFile) {
          await this.uploadVideoAndCreatePost(mediaFile);
      }
  }

  async uploadVideoAndCreatePost(mediaFile: MediaFile) {
      this.isUploading = true;
      this.isLoadingVibe = false;
      this.capturedImage = null;
      const loading = await this.loadingCtrl.create({ message: 'Publication vidéo...' });
      await loading.present();
      let uploadResult: UploadResult | null = null;

      try {
          uploadResult = await this.photoService.uploadMediaFile(mediaFile);

          if (!uploadResult || !uploadResult.downloadUrl || !uploadResult.filePath) {
              throw new Error("L'upload vidéo n'a pas retourné les informations nécessaires.");
          }

          const postData: NewPostData = {
              type: 'short',
              mediaUrl: uploadResult.downloadUrl,
              filePath: uploadResult.filePath,
              textContent: null
          };
          const postId = await this.postService.addPost(postData);
          await loading.dismiss();
          this.isUploading = false;

          if (postId) {
              await this.presentToast('Vidéo publiée avec succès !', 'success');
          } else {
              throw new Error("La création du post vidéo n'a pas retourné d'ID.");
          }

      } catch (error: any) {
          await loading.dismiss();
          this.isUploading = false;
          console.error("Erreur lors de la publication vidéo:", error);
          await this.presentToast(error.message || "Erreur lors de la publication vidéo.", 'danger');
      }
  }

  async confirmDeletePost(post: Post) {
      if (!post.id) return;

      if (this.authService.currentUser?.uid !== post.userId) {
          await this.presentToast("Vous ne pouvez pas supprimer ce post.", 'danger');
          return;
      }

      const alert = await this.alertCtrl.create({
          header: 'Confirmer',
          message: 'Voulez-vous vraiment supprimer ce post ?',
          buttons: [
              { text: 'Annuler', role: 'cancel' },
              {
                  text: 'Supprimer',
                  role: 'confirm',
                  handler: async () => {
                      const loading = await this.loadingCtrl.create({ message: 'Suppression...' });
                      await loading.present();
                      try {
                          await this.postService.deletePost(post.id!);
                          if (post.filePath) {
                              await this.photoService.deleteFileByPath(post.filePath);
                          }
                          await loading.dismiss();
                          await this.presentToast('Post supprimé.', 'success');
                      } catch (error: any) {
                          await loading.dismiss();
                          console.error("Erreur suppression post:", error);
                          await this.presentToast(error.message || 'Erreur suppression.', 'danger');
                      }
                  },
              },
          ],
      });
      await alert.present();
  }


  async logout() {
    try {
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' = 'danger') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}
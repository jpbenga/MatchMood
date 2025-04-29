// src/app/services/photo/photo.service.ts

import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage'; // Ajout deleteObject
import { AuthService } from '../auth/auth.service';
import { MediaCapture, MediaFile, CaptureVideoOptions, CaptureError } from '@awesome-cordova-plugins/media-capture/ngx';
import { Filesystem, ReadFileResult } from '@capacitor/filesystem';

// Interface pour le retour des uploads
export interface UploadResult {
    downloadUrl: string;
    filePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private storage: Storage = inject(Storage);
  private authService: AuthService = inject(AuthService);
  private mediaCapture: MediaCapture = inject(MediaCapture);

  constructor() { }

  public async takePicture(): Promise<Photo | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      return image;
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      return null;
    }
  }

  public async recordShortVideo(maxDuration: number = 6): Promise<MediaFile | null> {
     const options: CaptureVideoOptions = {
         limit: 1,
         duration: maxDuration,
         quality: 1
     };
     try {
         const result: MediaFile[] | CaptureError = await this.mediaCapture.captureVideo(options);
         if (result && !('code' in result) && result.length > 0) {
             return result[0];
         } else if (result && 'code' in result) {
             console.log('Erreur Media Capture:', result.code);
             return null;
         } else {
             return null;
         }
     } catch (error) {
         console.error('Erreur lors de captureVideo:', error);
         if (typeof error === 'string' && error.toLowerCase().includes('cancel')) {
            return null;
         }
         throw new Error("Erreur lors de l'enregistrement vidéo.");
     }
  }

  public async uploadPhoto(photo: Photo): Promise<UploadResult | null> {
    const user = this.authService.currentUser;
    if (!user || !photo.webPath) {
      throw new Error("Utilisateur non connecté ou chemin photo manquant.");
    }
    try {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const timestamp = Date.now();
      const fileExtension = blob.type.split('/')[1] || 'jpg';
      const fileName = `photo_${timestamp}_${user.uid}.${fileExtension}`;
      const filePath = `uploads/<span class="math-inline">\{user\.uid\}/</span>{fileName}`; // Chemin à sauvegarder
      const storageRef = ref(this.storage, filePath);
      const uploadTask = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(uploadTask.ref);
      return { downloadUrl, filePath }; // Retourner les deux
    } catch (error) {
      console.error("Erreur lors de l'upload de la photo:", error);
      throw error;
    }
  }

  public async uploadMediaFile(mediaFile: MediaFile): Promise<UploadResult | null> {
     const user = this.authService.currentUser;
     if (!user || !mediaFile.fullPath) {
       throw new Error("Utilisateur non connecté ou chemin média manquant.");
     }
     try {
       const fileData: ReadFileResult = await Filesystem.readFile({
         path: mediaFile.fullPath
       });

       if (typeof fileData.data !== 'string') {
            throw new Error('Impossible de lire les données du fichier vidéo comme attendu.');
       }

       const blob = this.base64ToBlob(fileData.data, mediaFile.type || 'video/mp4');

       const timestamp = Date.now();
       const fileExtension = mediaFile.name.split('.').pop() || 'mp4';
       const fileName = `video_${timestamp}_${user.uid}.${fileExtension}`;
       const filePath = `uploads/<span class="math-inline">\{user\.uid\}/</span>{fileName}`; // Chemin à sauvegarder
       const storageRef = ref(this.storage, filePath);
       const uploadTask = await uploadBytes(storageRef, blob);
       const downloadUrl = await getDownloadURL(uploadTask.ref);
       return { downloadUrl, filePath }; // Retourner les deux
     } catch (error) {
       console.error("Erreur lors de l'upload du média:", error);
       throw error;
     }
   }

   // Nouvelle méthode pour supprimer un fichier dans Storage
   public async deleteFileByPath(filePath: string): Promise<void> {
       try {
           const storageRef = ref(this.storage, filePath);
           await deleteObject(storageRef);
       } catch (error: any) {
           // Gérer les erreurs (ex: objet non trouvé, permissions)
           // Une erreur "storage/object-not-found" peut souvent être ignorée si le but est juste de nettoyer
           if (error.code === 'storage/object-not-found') {
               console.warn(`Fichier non trouvé dans Storage (peut-être déjà supprimé): ${filePath}`);
           } else {
               console.error("Erreur lors de la suppression du fichier dans Storage:", filePath, error);
               throw error; // Propage les autres erreurs
           }
       }
   }

   private base64ToBlob(base64: string, contentType: string = '', sliceSize: number = 512): Blob {
       const byteCharacters = atob(base64);
       const byteArrays = [];
       for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
           const slice = byteCharacters.slice(offset, offset + sliceSize);
           const byteNumbers = new Array(slice.length);
           for (let i = 0; i < slice.length; i++) {
               byteNumbers[i] = slice.charCodeAt(i);
           }
           const byteArray = new Uint8Array(byteNumbers);
           byteArrays.push(byteArray);
       }
       return new Blob(byteArrays, { type: contentType });
   }
}
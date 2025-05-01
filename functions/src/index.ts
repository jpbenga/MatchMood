import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();

setGlobalOptions({ region: "europe-west1" });

const db = admin.firestore();

export const sendPostNotification = onDocumentCreated("posts/{postId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.log("Aucun snapshot de données pour l'événement:", event.id);
    return null;
  }
  const postData = snap.data() as any;
  const postId = event.params.postId;

  if (!postData || !postData.userId) {
    logger.error("Données de post ou userId manquants:", postId);
    return null;
  }

  const userId = postData.userId;
  const postType = postData.type;

  logger.log(`Nouveau post (${postType}) détecté par ${userId}, ID: ${postId}`);

  let friendIds: string[] = [];
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
       const userData = userDoc.data() as any;
       friendIds = userData.friendIds || [];
       logger.log(`Auteur ${userId} a ${friendIds.length} ami(s).`);
    } else {
       logger.warn(`Document utilisateur non trouvé pour l'auteur ${userId}`);
       return null;
    }
  } catch (error) {
    logger.error(`Erreur lors de la récupération des amis pour ${userId}:`, error);
    return null;
  }

  if (friendIds.length === 0) {
    logger.log("L'auteur n'a pas d'amis à notifier.");
    return null;
  }

  logger.log("TODO: Récupérer les tokens FCM pour les IDs amis:", friendIds);
  const fcmTokens: string[] = [];

  const payload = {
    notification: {
      title: "Nouveau Post !",
      body: `Un nouveau post de type ${postType} a été ajouté.`,
    },
    data: {
      postId: postId,
      postType: postType,
      authorId: userId,
    },
  };

  logger.log("Payload de notification (non envoyé):", JSON.stringify(payload));

  if (fcmTokens.length > 0) {
      logger.log(`Tentative d'envoi à ${fcmTokens.length} token(s).`);
  } else {
      logger.log("Aucun token FCM à qui envoyer (logique de récupération non implémentée).");
  }

  return null;
});
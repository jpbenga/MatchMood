// src/app/models/friend-request.model.ts

import { Timestamp, FieldValue } from 'firebase/firestore';

export interface FriendRequest {
    id?: string; // ID du document Firestore
    senderId: string;
    receiverId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp | FieldValue;
    // Optionnel: Ajouter senderDisplayName, senderPhotoURL pour éviter lookup ?
}
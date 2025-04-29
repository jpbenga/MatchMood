// src/app/models/friend-group.model.ts

import { Timestamp } from 'firebase/firestore'; // Utilisation de l'import v9+ modulaire

export interface FriendGroup {
  id: string;
  name: string;
  memberUids: string[];
  associatedMatchId?: string;
  createdAt?: Timestamp;
  createdByUid?: string;
}
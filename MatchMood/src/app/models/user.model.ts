// src/app/models/user.model.ts

import { Timestamp, FieldValue, serverTimestamp  } from 'firebase/firestore'; // Utilisation de l'import v9+ modulaire

export interface User {
  uid: string;
  email: string | null;
  displayName?: string;
  photoURL?: string | null;
  friendIds?: string[];
  groupIds?: string[];
  createdAt?: Timestamp | FieldValue;
}
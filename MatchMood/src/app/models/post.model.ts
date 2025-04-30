// src/app/models/post.model.ts

import { Timestamp, FieldValue } from 'firebase/firestore';

export type PostType = 'photo' | 'vibe' | 'short';

export interface Post {
  id?: string;
  userId: string;
  type: PostType;
  mediaUrl?: string | null;
  filePath?: string | null; // Ajout du chemin dans Storage
  textContent?: string | null;
  associatedMatchId?: string;
  createdAt: Timestamp | FieldValue;
}
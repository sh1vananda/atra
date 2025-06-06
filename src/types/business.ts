
import type { ReactNode } from 'react';

// Reward structure simplified
export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  icon?: string; // Optional: intended for a Lucide icon name string
}

export interface Business {
  id: string;
  name: string;
  description: string;
  joinCode: string; 
  rewards: Reward[];
  ownerUid?: string; // Optional: UID of the admin who created/owns the business
  createdAt?: any; // Optional: Firestore ServerTimestamp
}


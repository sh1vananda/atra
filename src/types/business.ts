
import type { ReactNode } from 'react';

// Minimal reward structure for now, similar to what was in rewards page
export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon?: ReactNode; // Optional for now, can be icon name string later
  image: string;
  imageHint: string;
  category: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  joinCode: string; // Unique code for users to join this business's program
  rewards: Reward[];
}

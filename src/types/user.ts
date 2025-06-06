
export interface User {
  id: string;
  name: string;
  email: string;
  // Adding mock purchases for demonstration on admin panel
  mockPurchases?: Array<{
    id: string;
    item: string;
    amount: number;
    date: string; // ISO string date
    pointsEarned: number;
  }>;
}


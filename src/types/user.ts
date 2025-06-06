

export interface MockPurchase {
  id: string;
  item: string;
  amount: number;
  date: string; // ISO string date
  pointsEarned: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mockPurchases?: MockPurchase[];
}

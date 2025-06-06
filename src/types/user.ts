
export interface MockPurchase {
  id: string;
  item: string;
  amount: number;
  date: string; // ISO string date
  pointsEarned: number;
}

export interface UserMembership {
  businessId: string;
  businessName: string; // For easier display
  pointsBalance: number;
  purchases: MockPurchase[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  memberships: UserMembership[]; // User can be a member of multiple businesses
}

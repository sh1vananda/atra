
export interface AdminUser {
  uid: string; // Firebase Auth UID, also document ID in 'admins' collection
  email: string;
  businessId: string; // ID of the business this admin manages
  // businessName will be fetched dynamically by looking up the businessId in the 'businesses' collection
}

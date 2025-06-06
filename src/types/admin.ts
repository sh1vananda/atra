
export interface AdminUser {
  id: string; // User ID of the admin
  email: string;
  businessId: string; // ID of the business this admin manages
  businessName: string; // Name of the business for display
}


import type {FieldValue} from 'firebase/firestore';

export interface PurchaseAppeal {
  id: string; // Firestore document ID
  userId: string;
  userName: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  item: string;
  amount: number;
  pointsExpected: number; // Points user is appealing for
  appealReason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: FieldValue; // Firestore server timestamp
  reviewedAt?: FieldValue;
  adminReviewedBy?: string; // UID of admin who reviewed
  rejectionReason?: string; // Optional reason if rejected by admin
}

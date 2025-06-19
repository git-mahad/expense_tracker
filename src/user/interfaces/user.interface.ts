export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UserStats {
  totalExpenses: number;
  totalAmount: number;
  currentMonthExpenses: number;
  currentMonthAmount: number;
}

export interface UserActivity {
  id: number;
  type: 'expense_created' | 'expense_updated' | 'expense_deleted' | 'profile_updated';
  description: string;
  createdAt: Date;
}
export type UserRole = "admin" | "parent" | "kid";

export interface FamilyUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string; // Emoji, preset key, or custom image URL
  points: number; // Balance for kids
  createdAt: any;
  createdBy?: string;
  dailyStreak: number;
  lastCheckIn?: string; // YYYY-MM-DD
  telegramChatId?: string; // Kid-specific or user-specific telegram chat/channel ID
  restoresUsedThisMonth?: number; // Count of streak restores used in the current month
  lastRestoreMonth?: string; // Tracker for month boundary e.g. "2026-07"
}

export interface ChorePreset {
  id: string;
  title: string;
  description: string;
  points: number;
  executionLimitMinutes?: number; // Custom completion time limit in minutes
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  points: number;
  assignedTo: string[]; // List of Kid UIDs
  status: "pending" | "accepted" | "declined" | "completed" | "approved" | "rejected";
  acceptedBy?: string; // Kid UID who accepted
  createdAt: any;
  createdBy: string; // Parent UID
  timeoutAt: any; // Date timestamp - task disappears after 30 mins if not accepted
  deadlineAt?: any; // Date timestamp - task fails/expires after executionLimitMinutes from acceptance
  acceptedAt?: any;
  completedAt?: any;
  proofPhoto?: string; // URL from IMGBB
  parentFeedback?: string; // Feedback from parent on approval/rejection
  isUrgent?: boolean;
  finalPoints?: number; // Actual points awarded by parent
  executionLimitMinutes?: number; // Completion time limit set by parent (defaults to 60)
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  points: number; // Cost in coins
  stock: number;
  image: string; // URL or emoji or preset image
  createdBy: string;
  createdAt: any;
  category?: string; // e.g. "Игры", "Развлечения", "Сладости", "Другое"
  pinned?: boolean; // Featured at the top
  hidden?: boolean; // Hidden/soft-deleted
  sortOrder?: number; // For manual ordering
  discountPercentage?: number; // 1-99%
  discountUntil?: any; // Timestamp when sale ends
}

export interface Purchase {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  points: number; // Coins spent
  kidId: string;
  kidName: string;
  status: "pending" | "issued"; // 'pending' in progress, 'issued' handed over
  createdAt: any;
  issuedAt?: any;
}

export interface Transaction {
  id: string;
  kidId: string;
  kidName: string;
  type: "income" | "expense";
  amount: number;
  title: string;
  createdAt: any;
  balanceAfter?: number;
}

export interface SiteSettings {
  title: string;
  logo: string; // Emoji or word
  primaryColor: "indigo" | "amber" | "rose" | "emerald" | "violet" | "sky" | "orange";
  telegramChatId: string;
  chestImageUrl?: string; // Customizable image URL or fallback emoji
  categories?: string[]; // Custom store categories
}

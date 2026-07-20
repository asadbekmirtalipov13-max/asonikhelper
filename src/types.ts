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
  lastShopChestClaimed?: any; // ISO string or Timestamp
  telegramChatId?: string; // Kid-specific or user-specific telegram chat/channel ID
  restoresUsedThisMonth?: number;
  lastRestoreMonth?: string;
  chestsCount?: number;
  lastSeenUpdate?: number;
  achievements?: Record<string, {
    progress: number;
    completed: boolean;
    completedAt?: any;
    rewardClaimed?: boolean;
  }>;
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
  urgentNotified?: boolean;
  finalPoints?: number; // Actual points awarded by parent
  executionLimitMinutes?: number; // Completion time limit set by parent (defaults to 60)
  isWeekly?: boolean;
  weeklyDaysLogged?: number;
  weeklyPhotos?: string[];
  lastWeeklySubmissionTime?: any;
  weeklyProgress?: any[];
  weeklyDays?: {
    day: number;
    photoUrl: string;
    timestamp: any;
  }[];
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
  isChest?: boolean;
  chestMin?: number;
  chestMax?: number;
  pinned?: boolean; // Featured at the top
  hidden?: boolean; // Hidden/soft-deleted
  sortOrder?: number; // For manual ordering
  discountPercentage?: number; // 1-99%
  discountUntil?: any; // Timestamp when sale ends
  requiresInput?: boolean;
  inputLabel?: string;
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
  giftedBy?: string;
  customInput?: string;
}

export interface Transaction {
  id: string;
  kidId: string;
  kidName: string;
  type: "income" | "expense";
  amount: number;
  description?: string;
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
  faqs?: { id: string; question: string; answer: string }[];
  latestUpdate?: {
    version: number;
    title: string;
    text: string;
  };
}

export interface AppNotification {
  id: string;
  kidId: string;
  title: string;
  text: string;
  createdAt: any;
  read: boolean;
  type?: "message" | "chest" | "quest" | "system" | "achievement_reward";
  chestPoints?: number;
  rewardPoints?: number;
  rewardChest?: boolean;
  achievementId?: string;
}

export type PromoCode = {
  id: string;
  code: string;
  points: number;
  activationsLeft: number;
  active: boolean;
};

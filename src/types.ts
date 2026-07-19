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
}

export interface ChorePreset {
  id: string;
  title: string;
  description: string;
  points: number;
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
  deadlineAt?: any; // Date timestamp - task fails/expires after 60 mins from acceptance
  acceptedAt?: any;
  completedAt?: any;
  proofPhoto?: string; // URL from IMGBB
  parentFeedback?: string; // Feedback from parent on approval/rejection
  finalPoints?: number; // Actual points awarded by parent
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

export interface SiteSettings {
  title: string;
  logo: string; // Emoji or word
  primaryColor: "indigo" | "amber" | "rose" | "emerald" | "violet" | "sky" | "orange";
  telegramChatId: string;
}

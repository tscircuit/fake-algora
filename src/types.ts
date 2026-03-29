export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount_usd: number;
  currency: string;
  status: "open" | "in_progress" | "paid" | "cancelled";
  recipient_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  bounty_id: string;
  amount_usd: number;
  currency: string;
  recipient_username: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: string;
}

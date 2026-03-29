export type BountyStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "payment_pending"
  | "paid";

export interface Bounty {
  id: string;
  issue_number: number;
  repo: string;
  amount_usd: number;
  currency: string;
  status: BountyStatus;
  recipient_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  bounty_id: string;
  recipient_username: string;
  amount_usd: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendPaymentRequest {
  bounty_id: string;
  recipient_username: string;
  amount_usd: number;
  currency?: string;
}

export interface SendPaymentResponse {
  payment: Payment;
  message: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export type BountyStatus = "open" | "claimed" | "paid";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount_usd: number;
  currency: string;
  status: BountyStatus;
  recipient_username?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  bounty_id: string;
  amount_usd: number;
  currency: string;
  recipient_username: string;
  created_at: string;
}

export interface ApiError {
  error: string;
  details?: string | Record<string, unknown>;
}

export interface ApiSuccess<T> {
  data: T;
}

export type CreateBountyInput = Pick<
  Bounty,
  "title" | "description" | "amount_usd" | "currency"
> & { recipient_username?: string };

export interface SendPaymentInput {
  bounty_id: string;
}

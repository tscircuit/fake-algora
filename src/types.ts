export type PaymentStatus = "pending" | "processing" | "completed" | "failed"

export interface Payment {
  id: string
  bounty_id: string
  recipient_username: string
  recipient_email?: string
  amount_cents: number
  currency: string
  status: PaymentStatus
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface Bounty {
  id: string
  title: string
  description?: string
  amount_cents: number
  currency: string
  status: "open" | "claimed" | "paid" | "cancelled"
  issue_url?: string
  created_at: string
  updated_at: string
  payments: Payment[]
}

export interface SendPaymentRequest {
  bounty_id: string
  recipient_username: string
  recipient_email?: string
  amount_cents: number
  currency?: string
  metadata?: Record<string, unknown>
}

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiErrorResponse {
  data?: never
  error: {
    message: string
    code: string
    details?: unknown
  }
}

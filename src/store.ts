/**
 * In-memory store for the fake Algora server.
 * All data resets when the server restarts — perfect for testing.
 */
import { v4 as uuidv4 } from "uuid"
import type { Bounty, Payment, SendPaymentRequest } from "./types"

class Store {
  private bounties: Map<string, Bounty> = new Map()
  private payments: Map<string, Payment> = new Map()

  // ─── Bounties ────────────────────────────────────────────────────────────────

  createBounty(
    data: Partial<Omit<Bounty, "id" | "created_at" | "updated_at" | "payments">>
  ): Bounty {
    const now = new Date().toISOString()
    const bounty: Bounty = {
      id: uuidv4(),
      title: data.title ?? "Untitled Bounty",
      description: data.description,
      amount_cents: data.amount_cents ?? 0,
      currency: data.currency ?? "USD",
      status: data.status ?? "open",
      issue_url: data.issue_url,
      created_at: now,
      updated_at: now,
      payments: [],
    }
    this.bounties.set(bounty.id, bounty)
    return bounty
  }

  getBounty(id: string): Bounty | undefined {
    return this.bounties.get(id)
  }

  listBounties(): Bounty[] {
    return Array.from(this.bounties.values())
  }

  updateBounty(id: string, patch: Partial<Bounty>): Bounty | undefined {
    const existing = this.bounties.get(id)
    if (!existing) return undefined
    const updated: Bounty = {
      ...existing,
      ...patch,
      id,
      updated_at: new Date().toISOString(),
    }
    this.bounties.set(id, updated)
    return updated
  }

  // ─── Payments ────────────────────────────────────────────────────────────────

  createPayment(req: SendPaymentRequest): Payment {
    const now = new Date().toISOString()
    const payment: Payment = {
      id: uuidv4(),
      bounty_id: req.bounty_id,
      recipient_username: req.recipient_username,
      recipient_email: req.recipient_email,
      amount_cents: req.amount_cents,
      currency: req.currency ?? "USD",
      status: "pending",
      created_at: now,
      updated_at: now,
      metadata: req.metadata,
    }
    this.payments.set(payment.id, payment)

    // Attach to bounty
    const bounty = this.bounties.get(req.bounty_id)
    if (bounty) {
      bounty.payments.push(payment)
      bounty.updated_at = now
    }

    // Simulate async processing: transition pending → processing → completed
    this._simulatePaymentProcessing(payment.id)

    return payment
  }

  getPayment(id: string): Payment | undefined {
    return this.payments.get(id)
  }

  listPayments(bountyId?: string): Payment[] {
    const all = Array.from(this.payments.values())
    return bountyId ? all.filter((p) => p.bounty_id === bountyId) : all
  }

  updatePaymentStatus(
    id: string,
    status: Payment["status"]
  ): Payment | undefined {
    const payment = this.payments.get(id)
    if (!payment) return undefined
    payment.status = status
    payment.updated_at = new Date().toISOString()

    // Mirror status update in the bounty's embedded payments array
    const bounty = this.bounties.get(payment.bounty_id)
    if (bounty) {
      const idx = bounty.payments.findIndex((p) => p.id === id)
      if (idx !== -1) bounty.payments[idx] = payment
      if (status === "completed") {
        bounty.status = "paid"
        bounty.updated_at = payment.updated_at
      }
    }

    return payment
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Simulates the payment lifecycle: pending → processing → completed */
  private _simulatePaymentProcessing(paymentId: string): void {
    setTimeout(() => {
      this.updatePaymentStatus(paymentId, "processing")
    }, 200)

    setTimeout(() => {
      this.updatePaymentStatus(paymentId, "completed")
    }, 600)
  }

  /** Reset all data (useful between tests) */
  reset(): void {
    this.bounties.clear()
    this.payments.clear()
  }
}

// Export a singleton so routes share the same in-memory state
export const store = new Store()

/**
 * In-memory store for bounties and payments.
 * Seeded with a handful of example records for easy local testing.
 */

import { v4 as uuidv4 } from "uuid";
import type { Bounty, Payment } from "./types";

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const seedBounties: Bounty[] = [
  {
    id: "bounty-001",
    issue_number: 1,
    repo: "tscircuit/fake-algora",
    amount_usd: 10,
    currency: "USD",
    status: "open",
    recipient_username: null,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "bounty-002",
    issue_number: 42,
    repo: "tscircuit/core",
    amount_usd: 50,
    currency: "USD",
    status: "in_progress",
    recipient_username: "octocat",
    created_at: now(),
    updated_at: now(),
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export class Store {
  private bounties: Map<string, Bounty> = new Map();
  private payments: Map<string, Payment> = new Map();

  constructor(seed = true) {
    if (seed) {
      for (const b of seedBounties) {
        this.bounties.set(b.id, { ...b });
      }
    }
  }

  // ------ Bounties ----------------------------------------------------------

  listBounties(): Bounty[] {
    return Array.from(this.bounties.values());
  }

  getBounty(id: string): Bounty | undefined {
    return this.bounties.get(id);
  }

  createBounty(
    data: Omit<Bounty, "id" | "created_at" | "updated_at">
  ): Bounty {
    const bounty: Bounty = {
      ...data,
      id: uuidv4(),
      created_at: now(),
      updated_at: now(),
    };
    this.bounties.set(bounty.id, bounty);
    return bounty;
  }

  updateBounty(id: string, patch: Partial<Bounty>): Bounty | undefined {
    const existing = this.bounties.get(id);
    if (!existing) return undefined;
    const updated: Bounty = { ...existing, ...patch, updated_at: now() };
    this.bounties.set(id, updated);
    return updated;
  }

  // ------ Payments ----------------------------------------------------------

  listPayments(): Payment[] {
    return Array.from(this.payments.values());
  }

  getPayment(id: string): Payment | undefined {
    return this.payments.get(id);
  }

  getPaymentsByBounty(bountyId: string): Payment[] {
    return Array.from(this.payments.values()).filter(
      (p) => p.bounty_id === bountyId
    );
  }

  createPayment(
    data: Omit<Payment, "id" | "created_at" | "updated_at">
  ): Payment {
    const payment: Payment = {
      ...data,
      id: uuidv4(),
      created_at: now(),
      updated_at: now(),
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  updatePayment(id: string, patch: Partial<Payment>): Payment | undefined {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    const updated: Payment = { ...existing, ...patch, updated_at: now() };
    this.payments.set(id, updated);
    return updated;
  }

  /** Reset to empty (useful in tests) */
  reset() {
    this.bounties.clear();
    this.payments.clear();
  }
}

/** Singleton store used by the server */
export const store = new Store();

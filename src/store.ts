import { randomUUID } from "crypto";
import type { Bounty, BountyStatus, Payment } from "./types";

interface CreateBountyInput {
  title: string;
  description: string;
  amount_usd: number;
  currency: string;
  recipient_username?: string;
}

interface CreatePaymentInput {
  bounty_id: string;
  amount_usd: number;
  currency: string;
  recipient_username: string;
}

class Store {
  private bounties: Map<string, Bounty> = new Map();
  private payments: Map<string, Payment> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const now = new Date().toISOString();
    const seedBounties: Bounty[] = [
      {
        id: "bounty-seed-1",
        title: "Fix login bug",
        description: "The login page throws a 500 on bad credentials.",
        amount_usd: 50,
        currency: "USD",
        status: "open",
        created_at: now,
        updated_at: now,
      },
      {
        id: "bounty-seed-2",
        title: "Add dark mode",
        description: "Implement a system-level dark mode toggle.",
        amount_usd: 100,
        currency: "USD",
        status: "claimed",
        recipient_username: "alice",
        created_at: now,
        updated_at: now,
      },
      {
        id: "bounty-seed-3",
        title: "Write API docs",
        description: "Document all REST endpoints with OpenAPI.",
        amount_usd: 75,
        currency: "USD",
        status: "paid",
        recipient_username: "bob",
        created_at: now,
        updated_at: now,
      },
    ];
    for (const b of seedBounties) {
      this.bounties.set(b.id, b);
    }
  }

  // ── Bounty helpers ─────────────────────────────────────────────────────────

  listBounties(): Bounty[] {
    return Array.from(this.bounties.values());
  }

  getBounty(id: string): Bounty | undefined {
    return this.bounties.get(id);
  }

  createBounty(input: CreateBountyInput): Bounty {
    const now = new Date().toISOString();
    const bounty: Bounty = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      amount_usd: input.amount_usd,
      currency: input.currency,
      status: "open",
      recipient_username: input.recipient_username,
      created_at: now,
      updated_at: now,
    };
    this.bounties.set(bounty.id, bounty);
    return bounty;
  }

  updateBountyStatus(id: string, status: BountyStatus): Bounty | undefined {
    const bounty = this.bounties.get(id);
    if (!bounty) return undefined;
    const updated: Bounty = {
      ...bounty,
      status,
      updated_at: new Date().toISOString(),
    };
    this.bounties.set(id, updated);
    return updated;
  }

  // ── Payment helpers ────────────────────────────────────────────────────────

  listPayments(): Payment[] {
    return Array.from(this.payments.values());
  }

  getPayment(id: string): Payment | undefined {
    return this.payments.get(id);
  }

  createPayment(input: CreatePaymentInput): Payment {
    const payment: Payment = {
      id: randomUUID(),
      bounty_id: input.bounty_id,
      amount_usd: input.amount_usd,
      currency: input.currency,
      recipient_username: input.recipient_username,
      created_at: new Date().toISOString(),
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  /** Reset all state — useful in tests */
  reset() {
    this.bounties.clear();
    this.payments.clear();
    this.seed();
  }
}

export const store = new Store();

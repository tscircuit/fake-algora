import { randomUUID } from "crypto";
import type { Bounty, Payment } from "./types";

type BountyStatus = Bounty["status"];

interface CreateBountyInput {
  title: string;
  description: string;
  amount_usd: number;
  currency: string;
  recipient_username: string | null;
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
        id: "bounty-1",
        title: "Fix login bug",
        description: "Users cannot log in with email on Safari.",
        amount_usd: 100,
        currency: "USD",
        status: "open",
        recipient_username: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "bounty-2",
        title: "Add dark mode",
        description: "Implement a dark mode toggle for the UI.",
        amount_usd: 250,
        currency: "USD",
        status: "in_progress",
        recipient_username: "alice",
        created_at: now,
        updated_at: now,
      },
    ];

    for (const bounty of seedBounties) {
      this.bounties.set(bounty.id, bounty);
    }
  }

  reset() {
    this.bounties.clear();
    this.payments.clear();
    this.seed();
  }

  // Bounty helpers
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
      ...input,
      status: "open",
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

  // Payment helpers
  listPayments(): Payment[] {
    return Array.from(this.payments.values());
  }

  getPayment(id: string): Payment | undefined {
    return this.payments.get(id);
  }

  createPayment(input: CreatePaymentInput): Payment {
    const payment: Payment = {
      id: randomUUID(),
      ...input,
      status: "completed",
      created_at: new Date().toISOString(),
    };
    this.payments.set(payment.id, payment);
    return payment;
  }
}

export const store = new Store();

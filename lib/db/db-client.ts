import { createStore, type StoreApi } from "zustand/vanilla"
import { immer } from "zustand/middleware/immer"
import { hoist, type HoistedStoreApi } from "zustand-hoist"

import {
  databaseSchema,
  type DatabaseSchema,
  type Payment,
  type PaymentStatus,
  type Thing,
} from "./schema.ts"
import { combine } from "zustand/middleware"

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

type AddPaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
> & {
  status?: PaymentStatus
}

const initializer = combine(databaseSchema.parse({}), (set, get) => ({
  addThing: (thing: Omit<Thing, "thing_id">) => {
    set((state) => ({
      things: [
        ...state.things,
        { ...thing, thing_id: state.idCounter.toString() },
      ],
      idCounter: state.idCounter + 1,
    }))
  },

  /**
   * Create a new payment. If an `idempotency_key` is provided and a payment
   * already exists with that key, that existing payment is returned without
   * creating a duplicate — this lets clients retry sends safely.
   */
  addPayment: (input: AddPaymentInput): Payment => {
    if (input.idempotency_key) {
      const existing = get().payments.find(
        (p) => p.idempotency_key === input.idempotency_key,
      )
      if (existing) return existing
    }
    const now = new Date().toISOString()
    const state = get()
    const payment: Payment = {
      payment_id: state.paymentIdCounter.toString(),
      recipient: input.recipient,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: input.status ?? "pending",
      bounty_id: input.bounty_id ?? null,
      issue_number: input.issue_number ?? null,
      repository: input.repository ?? null,
      idempotency_key: input.idempotency_key ?? null,
      created_at: now,
      updated_at: now,
    }
    set((s) => ({
      payments: [...s.payments, payment],
      paymentIdCounter: s.paymentIdCounter + 1,
    }))
    return payment
  },

  /**
   * Transition a payment to a new status (e.g. "completed" or "canceled").
   * Refuses to mutate payments already in a terminal state — this mirrors
   * how real payment processors guard against retroactive edits.
   */
  updatePaymentStatus: (payment_id: string, status: PaymentStatus): Payment | null => {
    const state = get()
    const target = state.payments.find((p) => p.payment_id === payment_id)
    if (!target) return null
    if (target.status === "completed" || target.status === "canceled") {
      // Terminal — return unchanged to keep history immutable.
      return target
    }
    const now = new Date().toISOString()
    const updated: Payment = { ...target, status, updated_at: now }
    set((s) => ({
      payments: s.payments.map((p) =>
        p.payment_id === payment_id ? updated : p,
      ),
    }))
    return updated
  },

  getPayment: (payment_id: string): Payment | null => {
    return get().payments.find((p) => p.payment_id === payment_id) ?? null
  },
}))

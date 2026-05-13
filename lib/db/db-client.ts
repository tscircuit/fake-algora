import { createStore } from "zustand/vanilla"
import { hoist } from "zustand-hoist"

import {
  databaseSchema,
  type Payment,
  type PaymentStatus,
  type Thing,
} from "./schema.ts"
import { combine } from "zustand/middleware"

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

const nowIso = () => new Date().toISOString()

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

  createPayment: (
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    const existing = payment.idempotency_key
      ? get().payments.find((p) => p.idempotency_key === payment.idempotency_key)
      : undefined

    if (existing) return existing

    const timestamp = nowIso()
    const newPayment: Payment = {
      ...payment,
      payment_id: get().paymentIdCounter.toString(),
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    }

    set((state) => ({
      payments: [...state.payments, newPayment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return newPayment
  },

  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined
    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== paymentId) return payment
        updatedPayment = {
          ...payment,
          status,
          updated_at: nowIso(),
        }
        return updatedPayment
      }),
    }))
    return updatedPayment
  },
}))

import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type DatabaseSchema,
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

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
  addPayment: (
    payment: Omit<Payment, "payment_id" | "status" | "created_at">,
  ) => {
    const paymentId = `payment_${get().idCounter}`
    const newPayment: Payment = {
      ...payment,
      payment_id: paymentId,
      currency: payment.currency || "USD",
      status: "pending",
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: [...state.payments, newPayment],
      idCounter: state.idCounter + 1,
    }))

    return newPayment
  },
  findPaymentByIdempotencyKey: (idempotencyKey: string) => {
    return get().payments.find(
      (payment) => payment.idempotency_key === idempotencyKey,
    )
  },
  listPayments: (filters: { status?: PaymentStatus; repository?: string }) => {
    return get().payments.filter((payment) => {
      if (filters.status && payment.status !== filters.status) return false
      if (filters.repository && payment.repository !== filters.repository) {
        return false
      }
      return true
    })
  },
  completePayment: (paymentId: string) => {
    let completedPayment: Payment | undefined
    const completedAt = new Date().toISOString()

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== paymentId) return payment

        completedPayment = {
          ...payment,
          status: "completed",
          completed_at: completedAt,
        }
        return completedPayment
      }),
    }))

    return completedPayment
  },
}))

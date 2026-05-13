import { hoist } from "zustand-hoist"
import { createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
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
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    let createdPayment: Payment | undefined
    const now = new Date().toISOString()

    set((state) => {
      createdPayment = {
        ...payment,
        payment_id: `pay_${state.paymentCounter}`,
        status: "sent",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentCounter: state.paymentCounter + 1,
      }
    })

    return createdPayment as Payment
  },
  getPaymentById: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  getPaymentByIdempotencyKey: (idempotencyKey: string) => {
    return get().payments.find(
      (payment) => payment.idempotency_key === idempotencyKey,
    )
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined
    const now = new Date().toISOString()

    set((state) => {
      const payments = state.payments.map((payment) => {
        if (payment.payment_id !== paymentId) return payment

        updatedPayment = {
          ...payment,
          status,
          updated_at: now,
        }

        return updatedPayment
      })

      return { payments }
    })

    return updatedPayment
  },
}))

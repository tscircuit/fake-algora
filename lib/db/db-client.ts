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

const initializer = combine(databaseSchema.parse({}), (set) => ({
  addThing: (thing: Omit<Thing, "thing_id">) => {
    set((state) => ({
      things: [
        ...state.things,
        { ...thing, thing_id: state.idCounter.toString() },
      ],
      idCounter: state.idCounter + 1,
    }))
  },
  sendPayment: (
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    let nextPayment: Payment | undefined
    set((state) => {
      if (payment.idempotency_key) {
        const existingPayment = state.payments.find(
          (existing) => existing.idempotency_key === payment.idempotency_key,
        )
        if (existingPayment) {
          nextPayment = existingPayment
          return state
        }
      }

      const now = new Date().toISOString()
      nextPayment = {
        ...payment,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, nextPayment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    return nextPayment!
  },
  updatePaymentStatus: ({
    payment_id,
    status,
  }: {
    payment_id: string
    status: PaymentStatus
  }) => {
    let updatedPayment: Payment | undefined
    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) {
          return payment
        }

        updatedPayment = {
          ...payment,
          status,
          updated_at: new Date().toISOString(),
        }
        return updatedPayment
      }),
    }))

    return updatedPayment ?? null
  },
}))

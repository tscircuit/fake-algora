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
    const now = new Date().toISOString()
    let nextPayment: Payment | undefined

    set((state) => {
      if (payment.idempotency_key) {
        const existing = state.payments.find(
          (storedPayment) =>
            storedPayment.idempotency_key === payment.idempotency_key,
        )

        if (existing) {
          nextPayment = existing
          return {}
        }
      }

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
  updatePaymentStatus: (
    paymentId: string,
    status: Exclude<PaymentStatus, "pending">,
  ) => {
    const now = new Date().toISOString()
    let updatedPayment: Payment | undefined

    set((state) => {
      const payment = state.payments.find(
        (storedPayment) => storedPayment.payment_id === paymentId,
      )

      if (!payment || payment.status !== "pending") {
        return {}
      }

      updatedPayment = {
        ...payment,
        status,
        updated_at: now,
      }

      return {
        payments: state.payments.map((storedPayment) =>
          storedPayment.payment_id === paymentId
            ? updatedPayment!
            : storedPayment,
        ),
      }
    })

    return updatedPayment
  },
}))

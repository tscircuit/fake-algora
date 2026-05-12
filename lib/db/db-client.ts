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
    let savedPayment: Payment | undefined
    set((state) => {
      if (payment.idempotency_key) {
        const existingPayment = state.payments.find(
          (existing) => existing.idempotency_key === payment.idempotency_key,
        )
        if (existingPayment) {
          savedPayment = existingPayment
          return state
        }
      }

      const now = new Date().toISOString()
      savedPayment = {
        ...payment,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }
      return {
        ...state,
        payments: [...state.payments, savedPayment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })
    return savedPayment!
  },
  updatePaymentStatus: (
    payment_id: string,
    status: Extract<PaymentStatus, "completed" | "cancelled" | "failed">,
  ) => {
    let updatedPayment: Payment | undefined
    set((state) => {
      const payments = state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) return payment
        updatedPayment = {
          ...payment,
          status,
          updated_at: new Date().toISOString(),
        }
        return updatedPayment
      })
      return { ...state, payments }
    })
    return updatedPayment
  },
}))

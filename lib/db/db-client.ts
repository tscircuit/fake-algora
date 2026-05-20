import { hoist } from "zustand-hoist"
import { combine } from "zustand/middleware"
import { createStore } from "zustand/vanilla"
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
  createPayment: (
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    let createdPayment: Payment | undefined
    set((state) => {
      if (payment.idempotency_key) {
        const existingPayment = state.payments.find(
          (existing) => existing.idempotency_key === payment.idempotency_key,
        )
        if (existingPayment) {
          createdPayment = existingPayment
          return state
        }
      }

      const now = new Date().toISOString()
      createdPayment = {
        ...payment,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    return createdPayment as Payment
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined
    set((state) => {
      const payment = state.payments.find(
        (existing) => existing.payment_id === paymentId,
      )
      if (!payment) {
        return state
      }
      if (payment.status !== "pending") {
        updatedPayment = payment
        return state
      }

      const now = new Date().toISOString()
      const payments = state.payments.map((existing) => {
        if (existing.payment_id !== paymentId) {
          return existing
        }
        updatedPayment = {
          ...existing,
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

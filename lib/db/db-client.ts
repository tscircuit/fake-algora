import { hoist } from "zustand-hoist"
import { combine } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { createStore } from "zustand/vanilla"

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
  sendPayment: (
    payment: Omit<
      Payment,
      | "payment_id"
      | "status"
      | "created_at"
      | "updated_at"
      | "completed_at"
      | "cancelled_at"
    >,
  ) => {
    const now = new Date().toISOString()
    let createdPayment: Payment | undefined

    set((state) => {
      const existingPayment = payment.idempotency_key
        ? state.payments.find(
            (existing) => existing.idempotency_key === payment.idempotency_key,
          )
        : undefined

      if (existingPayment) {
        createdPayment = existingPayment
        return {}
      }

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

    return createdPayment!
  },
  listPayments: (filters?: {
    status?: PaymentStatus
    recipient?: string
    repository?: string
    bounty_id?: string
  }) => {
    const state = get()
    return state.payments.filter((payment) => {
      if (filters?.status && payment.status !== filters.status) return false
      if (filters?.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters?.repository && payment.repository !== filters.repository) {
        return false
      }
      if (filters?.bounty_id && payment.bounty_id !== filters.bounty_id) {
        return false
      }
      return true
    })
  },
  getPayment: (payment_id: string) => {
    return get().payments.find((payment) => payment.payment_id === payment_id)
  },
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    const now = new Date().toISOString()
    let updatedPayment: Payment | undefined

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) return payment

        updatedPayment = {
          ...payment,
          status,
          updated_at: now,
          completed_at: status === "completed" ? now : payment.completed_at,
          cancelled_at: status === "cancelled" ? now : payment.cancelled_at,
        }
        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))

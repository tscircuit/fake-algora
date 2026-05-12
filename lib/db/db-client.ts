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
  createPayment: (
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    const now = new Date().toISOString()
    const nextPayment: Payment = {
      ...payment,
      payment_id: get().paymentIdCounter.toString(),
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, nextPayment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return nextPayment
  },
  getPaymentById: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  getPaymentByIdempotencyKey: (idempotencyKey: string) => {
    return get().payments.find(
      (payment) => payment.idempotency_key === idempotencyKey,
    )
  },
  listPayments: (filters?: {
    status?: PaymentStatus
    recipient_email?: string
    repository?: string
  }) => {
    return get().payments.filter((payment) => {
      if (filters?.status && payment.status !== filters.status) return false
      if (
        filters?.recipient_email &&
        payment.recipient_email !== filters.recipient_email
      ) {
        return false
      }
      if (filters?.repository && payment.repository !== filters.repository) {
        return false
      }
      return true
    })
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const now = new Date().toISOString()
    let updatedPayment: Payment | undefined

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== paymentId) return payment
        updatedPayment = { ...payment, status, updated_at: now }
        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))

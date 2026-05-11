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

type CreatePaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
>

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
  sendPayment: (paymentInput: CreatePaymentInput) => {
    const now = new Date().toISOString()
    const existingPayment =
      paymentInput.idempotency_key !== undefined
        ? get().payments.find(
            (payment) =>
              payment.idempotency_key === paymentInput.idempotency_key,
          )
        : undefined

    if (existingPayment) {
      return existingPayment
    }

    const payment: Payment = {
      ...paymentInput,
      payment_id: `payment_${get().paymentIdCounter}`,
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return payment
  },
  listPayments: (filters?: {
    recipient?: string
    repository?: string
    status?: PaymentStatus
  }) => {
    return get().payments.filter((payment) => {
      if (filters?.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters?.repository && payment.repository !== filters.repository) {
        return false
      }
      if (filters?.status && payment.status !== filters.status) {
        return false
      }
      return true
    })
  },
  getPayment: (payment_id: string) => {
    return get().payments.find((payment) => payment.payment_id === payment_id)
  },
  updatePaymentStatus: ({
    payment_id,
    status,
  }: {
    payment_id: string
    status: PaymentStatus
  }) => {
    let updatedPayment: Payment | undefined
    const now = new Date().toISOString()

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) return payment
        updatedPayment = {
          ...payment,
          status,
          updated_at: now,
        }
        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))

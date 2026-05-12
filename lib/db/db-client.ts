import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

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

type PaymentInput = Omit<
  Payment,
  | "payment_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "completed_at"
  | "canceled_at"
  | "failed_at"
>

const statusTimestampField = {
  completed: "completed_at",
  canceled: "canceled_at",
  failed: "failed_at",
  pending: undefined,
} as const satisfies Record<PaymentStatus, keyof Payment | undefined>

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
  addPayment: (payment: PaymentInput): Payment => {
    const existingPayment = payment.idempotency_key
      ? get().payments.find(
          (storedPayment) =>
            storedPayment.idempotency_key === payment.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return existingPayment
    }

    const now = new Date().toISOString()
    const newPayment: Payment = {
      ...payment,
      payment_id: get().idCounter.toString(),
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, newPayment],
      idCounter: state.idCounter + 1,
    }))

    return newPayment
  },
  getPayment: (payment_id: string): Payment | undefined => {
    return get().payments.find((payment) => payment.payment_id === payment_id)
  },
  listPayments: (
    filters: Partial<Pick<Payment, "recipient" | "status" | "repository">>,
  ): Payment[] => {
    return get().payments.filter((payment) => {
      if (filters.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters.status && payment.status !== filters.status) {
        return false
      }
      if (filters.repository && payment.repository !== filters.repository) {
        return false
      }
      return true
    })
  },
  updatePaymentStatus: (
    payment_id: string,
    status: Exclude<PaymentStatus, "pending">,
  ): Payment | undefined => {
    const now = new Date().toISOString()
    let updatedPayment: Payment | undefined

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) {
          return payment
        }

        const timestampField = statusTimestampField[status]
        updatedPayment = {
          ...payment,
          status,
          updated_at: now,
          ...(timestampField ? { [timestampField]: now } : {}),
        }
        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))

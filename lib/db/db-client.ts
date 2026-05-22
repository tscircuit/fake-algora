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

type CreatePaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
> & {
  status?: PaymentStatus
}

const terminalStatuses = new Set<PaymentStatus>([
  "completed",
  "canceled",
  "failed",
])

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
  createPayment: (input: CreatePaymentInput) => {
    const existingPayment = input.idempotency_key
      ? get().payments.find(
          (payment) => payment.idempotency_key === input.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return { payment: existingPayment, idempotentReplay: true }
    }

    const timestamp = new Date().toISOString()
    const payment: Payment = {
      ...input,
      payment_id: `pay_${get().paymentCounter}`,
      currency: input.currency || "USD",
      status: input.status || "pending",
      created_at: timestamp,
      updated_at: timestamp,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentCounter: state.paymentCounter + 1,
    }))

    return { payment, idempotentReplay: false }
  },
  findPaymentById: (paymentId: string) => {
    return (
      get().payments.find((payment) => payment.payment_id === paymentId) ?? null
    )
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
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const existingPayment = get().payments.find(
      (payment) => payment.payment_id === paymentId,
    )

    if (!existingPayment) {
      return null
    }

    if (terminalStatuses.has(existingPayment.status)) {
      return existingPayment
    }

    const updatedPayment: Payment = {
      ...existingPayment,
      status,
      updated_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === paymentId ? updatedPayment : payment,
      ),
    }))

    return updatedPayment
  },
}))

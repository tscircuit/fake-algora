import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type DatabaseSchema,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

interface CreatePaymentInput {
  recipient: string
  amount: number
  currency?: string
  bounty_id?: string
  bounty_issue?: string
  repository?: string
  idempotency_key?: string
}

interface PaymentFilters {
  recipient?: string
  status?: PaymentStatus
  bounty_issue?: string
  repository?: string
}

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
  createPayment: (payment: CreatePaymentInput) => {
    const state = get()
    const existingPayment = payment.idempotency_key
      ? state.payments.find(
          (existingPayment) =>
            existingPayment.idempotency_key === payment.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return existingPayment
    }

    const now = new Date().toISOString()
    const newPayment = {
      payment_id: state.paymentIdCounter.toString(),
      recipient: payment.recipient,
      amount: payment.amount,
      currency: payment.currency ?? "USD",
      bounty_id: payment.bounty_id,
      bounty_issue: payment.bounty_issue,
      repository: payment.repository,
      status: "pending" as const,
      idempotency_key: payment.idempotency_key,
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, newPayment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return newPayment
  },
  listPayments: (filters: PaymentFilters = {}) => {
    return get().payments.filter((payment) => {
      if (filters.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters.status && payment.status !== filters.status) {
        return false
      }
      if (
        filters.bounty_issue &&
        payment.bounty_issue !== filters.bounty_issue
      ) {
        return false
      }
      if (filters.repository && payment.repository !== filters.repository) {
        return false
      }
      return true
    })
  },
  getPayment: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const state = get()
    const payment = state.payments.find(
      (payment) => payment.payment_id === paymentId,
    )

    if (!payment) {
      return undefined
    }

    if (payment.status !== "pending") {
      return payment
    }

    const updatedPayment = {
      ...payment,
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

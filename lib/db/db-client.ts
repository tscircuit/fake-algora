import { hoist } from "zustand-hoist"
import { createStore } from "zustand/vanilla"

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

type CreatePaymentInput = Pick<
  Payment,
  | "recipient"
  | "amount"
  | "currency"
  | "repository"
  | "issue_number"
  | "bounty_id"
  | "idempotency_key"
>

type PaymentFilters = {
  recipient?: string
  repository?: string
  issue_number?: number
  status?: PaymentStatus
}

const now = () => new Date().toISOString()

const hasMatchingIdempotencyScope = (
  payment: Payment,
  paymentInput: CreatePaymentInput,
) => {
  return (
    payment.idempotency_key === paymentInput.idempotency_key &&
    payment.recipient === paymentInput.recipient &&
    payment.amount === paymentInput.amount &&
    payment.currency === paymentInput.currency &&
    payment.repository === paymentInput.repository &&
    payment.issue_number === paymentInput.issue_number &&
    payment.bounty_id === paymentInput.bounty_id
  )
}

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
    paymentInput: CreatePaymentInput,
  ): { payment: Payment; replayed: boolean } => {
    if (paymentInput.idempotency_key) {
      const replayedPayment = get().payments.find((payment) =>
        hasMatchingIdempotencyScope(payment, paymentInput),
      )
      if (replayedPayment) {
        return { payment: replayedPayment, replayed: true }
      }
    }

    const timestamp = now()
    const payment: Payment = {
      ...paymentInput,
      payment_id: `pay_${get().idCounter}`,
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      idCounter: state.idCounter + 1,
    }))

    return { payment, replayed: false }
  },
  listPayments: (filters: PaymentFilters = {}) => {
    return get().payments.filter((payment) => {
      if (
        filters.recipient !== undefined &&
        payment.recipient !== filters.recipient
      ) {
        return false
      }
      if (
        filters.repository !== undefined &&
        payment.repository !== filters.repository
      ) {
        return false
      }
      if (
        filters.issue_number !== undefined &&
        payment.issue_number !== filters.issue_number
      ) {
        return false
      }
      if (filters.status !== undefined && payment.status !== filters.status) {
        return false
      }
      return true
    })
  },
  getPayment: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  setPaymentStatus: (
    paymentId: string,
    status: Extract<PaymentStatus, "completed" | "canceled">,
  ): { payment: Payment; changed: boolean } | undefined => {
    const existingPayment = get().payments.find(
      (payment) => payment.payment_id === paymentId,
    )
    if (!existingPayment) {
      return undefined
    }

    if (existingPayment.status !== "pending") {
      return { payment: existingPayment, changed: false }
    }

    const timestamp = now()
    const updatedPayment: Payment = {
      ...existingPayment,
      status,
      updated_at: timestamp,
      completed_at: status === "completed" ? timestamp : undefined,
      canceled_at: status === "canceled" ? timestamp : undefined,
    }

    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === paymentId ? updatedPayment : payment,
      ),
    }))

    return { payment: updatedPayment, changed: true }
  },
}))

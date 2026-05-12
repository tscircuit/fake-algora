import { hoist } from "zustand-hoist"
import { combine } from "zustand/middleware"
import { createStore } from "zustand/vanilla"
import {
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

export interface CreatePaymentInput {
  recipient: string
  amount: number
  currency?: string
  bounty_id?: string
  issue_number?: number
  repository?: string
  idempotency_key?: string
}

export interface PaymentFilters {
  recipient?: string
  status?: PaymentStatus
  repository?: string
  bounty_id?: string
}

const terminalStatuses = new Set<PaymentStatus>([
  "completed",
  "cancelled",
  "failed",
])

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

const initializer = combine(databaseSchema.parse({}), (set, dbGet) => ({
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
      ? dbGet().payments.find(
          (payment) => payment.idempotency_key === input.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return existingPayment
    }

    const now = new Date().toISOString()
    const paymentId = `pay_${dbGet().paymentIdCounter}`
    const payment: Payment = {
      payment_id: paymentId,
      recipient: input.recipient,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: "pending",
      bounty_id: input.bounty_id,
      issue_number: input.issue_number,
      repository: input.repository,
      idempotency_key: input.idempotency_key,
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return payment
  },
  getPayment: (paymentId: string) => {
    return dbGet().payments.find((payment) => payment.payment_id === paymentId)
  },
  listPayments: (filters: PaymentFilters = {}) => {
    return dbGet().payments.filter((payment) => {
      if (filters.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters.status && payment.status !== filters.status) {
        return false
      }
      if (filters.repository && payment.repository !== filters.repository) {
        return false
      }
      if (filters.bounty_id && payment.bounty_id !== filters.bounty_id) {
        return false
      }
      return true
    })
  },
  updatePaymentStatus: (
    paymentId: string,
    status: Exclude<PaymentStatus, "pending">,
    failureReason?: string,
  ) => {
    const payment = dbGet().payments.find(
      (payment) => payment.payment_id === paymentId,
    )

    if (!payment) {
      return undefined
    }

    if (terminalStatuses.has(payment.status) && payment.status !== status) {
      return payment
    }

    const now = new Date().toISOString()
    let updatedPayment: Payment | undefined

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== paymentId) {
          return payment
        }

        updatedPayment = {
          ...payment,
          status,
          failure_reason: status === "failed" ? failureReason : undefined,
          updated_at: now,
        }

        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))

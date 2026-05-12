import { hoist } from "zustand-hoist"
import { createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

export interface CreatePaymentInput {
  recipient_email: string
  amount_cents: number
  currency?: string
  bounty_id?: string
  issue_number?: number
  repository?: string
  idempotency_key?: string
}

export interface ListPaymentsInput {
  status?: PaymentStatus
  recipient_email?: string
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
  createPayment: (input: CreatePaymentInput) => {
    const now = new Date().toISOString()
    let payment: Payment | undefined
    let idempotentReplay = false

    set((state) => {
      if (input.idempotency_key) {
        const existingPayment = state.payments.find(
          (candidate) => candidate.idempotency_key === input.idempotency_key,
        )
        if (existingPayment) {
          payment = existingPayment
          idempotentReplay = true
          return state
        }
      }

      payment = {
        payment_id: `payment_${state.paymentIdCounter}`,
        recipient_email: input.recipient_email,
        amount_cents: input.amount_cents,
        currency: (input.currency ?? "usd").toLowerCase(),
        bounty_id: input.bounty_id,
        issue_number: input.issue_number,
        repository: input.repository,
        idempotency_key: input.idempotency_key,
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, payment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    return { payment: payment!, idempotent_replay: idempotentReplay }
  },
  listPayments: (filters: ListPaymentsInput = {}) => {
    return get().payments.filter((payment) => {
      if (filters.status && payment.status !== filters.status) return false
      if (
        filters.recipient_email &&
        payment.recipient_email !== filters.recipient_email
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
    let updatedPayment: Payment | undefined
    let error: "not_found" | "terminal_status" | undefined
    const now = new Date().toISOString()

    set((state) => {
      const payment = state.payments.find(
        (candidate) => candidate.payment_id === paymentId,
      )
      if (!payment) {
        error = "not_found"
        return state
      }
      if (payment.status !== "pending") {
        error = "terminal_status"
        updatedPayment = payment
        return state
      }

      const payments = state.payments.map((candidate) => {
        if (candidate.payment_id !== paymentId) return candidate
        updatedPayment = { ...candidate, status, updated_at: now }
        return updatedPayment
      })

      return { payments }
    })

    return { payment: updatedPayment, error }
  },
}))

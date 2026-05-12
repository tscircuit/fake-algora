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

export interface CreatePaymentInput {
  recipient: string
  amount: number
  currency?: string
  bounty_id?: string
  issue_number?: number
  repository?: string
  idempotency_key?: string
  note?: string
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
  createPayment: (input: CreatePaymentInput) => {
    let result: { payment: Payment; idempotent_replay: boolean } | undefined

    set((state) => {
      const existingPayment = input.idempotency_key
        ? state.payments.find(
            (payment) => payment.idempotency_key === input.idempotency_key,
          )
        : undefined

      if (existingPayment) {
        result = {
          payment: existingPayment,
          idempotent_replay: true,
        }
        return {}
      }

      const now = new Date().toISOString()
      const payment: Payment = {
        payment_id: state.paymentIdCounter.toString(),
        recipient: input.recipient,
        amount: input.amount,
        currency: input.currency ?? "USD",
        status: "pending",
        bounty_id: input.bounty_id,
        issue_number: input.issue_number,
        repository: input.repository,
        idempotency_key: input.idempotency_key,
        note: input.note,
        created_at: now,
        updated_at: now,
      }

      result = {
        payment,
        idempotent_replay: false,
      }

      return {
        payments: [...state.payments, payment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    if (!result) {
      throw new Error("Payment was not created")
    }

    return result
  },
  listPayments: (filters: {
    recipient?: string
    status?: PaymentStatus
    repository?: string
  }) => {
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
  getPayment: (payment_id: string) => {
    return get().payments.find((payment) => payment.payment_id === payment_id)
  },
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined

    set((state) => {
      const now = new Date().toISOString()
      const payments = state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) {
          return payment
        }

        updatedPayment = {
          ...payment,
          status,
          updated_at: now,
          completed_at:
            status === "completed" ? payment.completed_at ?? now : undefined,
          canceled_at:
            status === "canceled" ? payment.canceled_at ?? now : undefined,
          failed_at: status === "failed" ? payment.failed_at ?? now : undefined,
        }

        return updatedPayment
      })

      return {
        payments,
      }
    })

    return updatedPayment
  },
}))

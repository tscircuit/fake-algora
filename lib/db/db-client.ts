import { hoist } from "zustand-hoist"
import { createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

type CreatePaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at" | "sent_at"
>

const terminalPaymentStatuses = new Set<PaymentStatus>([
  "completed",
  "canceled",
  "failed",
])

const nowIso = () => new Date().toISOString()

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
  sendPayment: (input: CreatePaymentInput) => {
    let payment!: Payment
    set((state) => {
      if (input.idempotency_key) {
        const existing = state.payments.find(
          (item) => item.idempotency_key === input.idempotency_key,
        )
        if (existing) {
          payment = existing
          return state
        }
      }

      const timestamp = nowIso()
      payment = {
        ...input,
        payment_id: state.paymentIdCounter.toString(),
        currency: input.currency.toLowerCase(),
        status: "sent",
        created_at: timestamp,
        updated_at: timestamp,
        sent_at: timestamp,
      }

      return {
        payments: [...state.payments, payment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })
    return payment
  },
  listPayments: (filters?: {
    recipient_email?: string | null
    status?: PaymentStatus | null
  }) => {
    return get().payments.filter((payment) => {
      if (
        filters?.recipient_email &&
        payment.recipient_email !== filters.recipient_email
      ) {
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
  updatePaymentStatus: (
    payment_id: string,
    status: Extract<PaymentStatus, "completed" | "canceled" | "failed">,
  ) => {
    let payment: Payment | null = null
    set((state) => {
      const existing = state.payments.find(
        (item) => item.payment_id === payment_id,
      )
      if (!existing) return state
      if (terminalPaymentStatuses.has(existing.status)) {
        payment = existing
        return state
      }

      const timestamp = nowIso()
      const updatedPayment: Payment = {
        ...existing,
        status,
        updated_at: timestamp,
        ...(status === "completed" ? { completed_at: timestamp } : {}),
        ...(status === "canceled" ? { canceled_at: timestamp } : {}),
        ...(status === "failed" ? { failed_at: timestamp } : {}),
      }
      payment = updatedPayment
      return {
        payments: state.payments.map((item) =>
          item.payment_id === payment_id ? updatedPayment : item,
        ),
      }
    })
    return payment
  },
}))

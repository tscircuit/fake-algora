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

type NewPayment = Pick<Payment, "recipient" | "amount"> &
  Partial<
    Pick<
      Payment,
      | "currency"
      | "bounty_id"
      | "issue_number"
      | "repository"
      | "idempotency_key"
    >
  >

const terminalStatuses = new Set<PaymentStatus>(["completed", "canceled"])

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
  addPayment: (paymentInput: NewPayment) => {
    const now = new Date().toISOString()
    const payment: Payment = {
      payment_id: `pay_${get().paymentCounter}`,
      recipient: paymentInput.recipient,
      amount: paymentInput.amount,
      currency: paymentInput.currency ?? "USD",
      status: "pending",
      bounty_id: paymentInput.bounty_id,
      issue_number: paymentInput.issue_number,
      repository: paymentInput.repository,
      idempotency_key: paymentInput.idempotency_key,
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentCounter: state.paymentCounter + 1,
    }))

    return payment
  },
  findPaymentById: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  findPaymentByIdempotencyKey: (idempotencyKey: string) => {
    return get().payments.find(
      (payment) => payment.idempotency_key === idempotencyKey,
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
  transitionPayment: (
    paymentId: string,
    status: Exclude<PaymentStatus, "pending">,
  ) => {
    const payment = get().payments.find(
      (existingPayment) => existingPayment.payment_id === paymentId,
    )
    if (!payment) return undefined
    if (terminalStatuses.has(payment.status)) return payment

    const now = new Date().toISOString()
    const updatedPayment: Payment = {
      ...payment,
      status,
      updated_at: now,
      completed_at: status === "completed" ? now : payment.completed_at,
      canceled_at: status === "canceled" ? now : payment.canceled_at,
    }

    set((state) => ({
      payments: state.payments.map((existingPayment) =>
        existingPayment.payment_id === paymentId
          ? updatedPayment
          : existingPayment,
      ),
    }))

    return updatedPayment
  },
}))

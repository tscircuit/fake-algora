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

type SendPaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "completed_at" | "canceled_at"
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
  sendPayment: (input: SendPaymentInput) => {
    const state = get()
    const existingPaymentId = input.idempotency_key
      ? state.paymentIdByIdempotencyKey[input.idempotency_key]
      : undefined
    const existingPayment = existingPaymentId
      ? state.payments.find(
          (payment) => payment.payment_id === existingPaymentId,
        )
      : undefined

    if (existingPayment) {
      return { payment: existingPayment, replayed: true }
    }

    const payment: Payment = {
      ...input,
      payment_id: state.idCounter.toString(),
      status: "pending",
      created_at: new Date().toISOString(),
    }

    set((currentState) => ({
      payments: [...currentState.payments, payment],
      paymentIdByIdempotencyKey: input.idempotency_key
        ? {
            ...currentState.paymentIdByIdempotencyKey,
            [input.idempotency_key]: payment.payment_id,
          }
        : currentState.paymentIdByIdempotencyKey,
      idCounter: currentState.idCounter + 1,
    }))

    return { payment, replayed: false }
  },
  getPayment: (paymentId: string) => {
    return (
      get().payments.find((payment) => payment.payment_id === paymentId) ?? null
    )
  },
  listPayments: (filters?: {
    recipient?: string
    status?: PaymentStatus
  }) => {
    return get().payments.filter((payment) => {
      if (filters?.recipient && payment.recipient !== filters.recipient) {
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
    status: Extract<PaymentStatus, "completed" | "canceled">,
  ) => {
    const payment = get().payments.find(
      (candidate) => candidate.payment_id === paymentId,
    )

    if (!payment) {
      return { ok: false, error: "payment_not_found" }
    }

    if (terminalStatuses.has(payment.status)) {
      return { ok: false, payment, error: "payment_already_terminal" }
    }

    const timestampField =
      status === "completed" ? "completed_at" : "canceled_at"
    const updatedPayment: Payment = {
      ...payment,
      status,
      [timestampField]: new Date().toISOString(),
    }

    set((currentState) => ({
      payments: currentState.payments.map((candidate) =>
        candidate.payment_id === paymentId ? updatedPayment : candidate,
      ),
    }))

    return { ok: true, payment: updatedPayment }
  },
}))

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

type CreatePaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
>

const terminalPaymentStatuses = new Set<PaymentStatus>([
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
  createPayment: (payment: CreatePaymentInput) => {
    let existingPayment: Payment | undefined
    let createdPayment: Payment | undefined

    set((state) => {
      existingPayment = payment.idempotency_key
        ? state.payments.find(
            (existing) =>
              existing.idempotency_key === payment.idempotency_key &&
              existing.recipient === payment.recipient,
          )
        : undefined

      if (existingPayment) {
        return state
      }

      const timestamp = new Date().toISOString()
      createdPayment = {
        ...payment,
        payment_id: state.paymentCounter.toString(),
        status: "pending",
        created_at: timestamp,
        updated_at: timestamp,
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentCounter: state.paymentCounter + 1,
      }
    })

    return {
      idempotent: Boolean(existingPayment),
      payment: existingPayment ?? createdPayment!,
    }
  },
  getPayment: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    let payment: Payment | undefined
    let error: string | undefined

    set((state) => {
      const existingPayment = state.payments.find(
        (payment) => payment.payment_id === paymentId,
      )

      if (!existingPayment) {
        error = "payment_not_found"
        return state
      }

      if (terminalPaymentStatuses.has(existingPayment.status)) {
        error = "payment_already_terminal"
        payment = existingPayment
        return state
      }

      const timestamp = new Date().toISOString()
      payment = {
        ...existingPayment,
        status,
        updated_at: timestamp,
        completed_at:
          status === "completed" ? timestamp : existingPayment.completed_at,
        canceled_at:
          status === "canceled" ? timestamp : existingPayment.canceled_at,
        failed_at: status === "failed" ? timestamp : existingPayment.failed_at,
      }

      return {
        payments: state.payments.map((existing) =>
          existing.payment_id === paymentId ? payment! : existing,
        ),
      }
    })

    return { error, payment }
  },
}))

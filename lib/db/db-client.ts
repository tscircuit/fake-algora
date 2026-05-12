import { hoist } from "zustand-hoist"
import { combine } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

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
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    const now = new Date().toISOString()
    let createdPayment: Payment | undefined

    set((state) => {
      const existingPayment = payment.idempotency_key
        ? state.payments.find(
            (storedPayment) =>
              storedPayment.idempotency_key === payment.idempotency_key,
          )
        : undefined

      if (existingPayment) {
        createdPayment = existingPayment
        return state
      }

      createdPayment = {
        ...payment,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    if (!createdPayment) {
      throw new Error("Failed to create payment")
    }

    return createdPayment
  },
  findPayment: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  listPayments: (filters: {
    status?: PaymentStatus
    recipient?: string
    repository?: string
  }) => {
    return get().payments.filter((payment) => {
      return (
        (!filters.status || payment.status === filters.status) &&
        (!filters.recipient || payment.recipient === filters.recipient) &&
        (!filters.repository || payment.repository === filters.repository)
      )
    })
  },
  transitionPayment: (
    paymentId: string,
    status: Exclude<PaymentStatus, "pending">,
  ) => {
    let updatedPayment: Payment | undefined
    let transitionError: "not_found" | "terminal" | undefined

    set((state) => {
      const payment = state.payments.find(
        (storedPayment) => storedPayment.payment_id === paymentId,
      )

      if (!payment) {
        transitionError = "not_found"
        return state
      }

      if (payment.status !== "pending") {
        transitionError = "terminal"
        updatedPayment = payment
        return state
      }

      const now = new Date().toISOString()
      const payments = state.payments.map((storedPayment) => {
        if (storedPayment.payment_id !== paymentId) return storedPayment
        updatedPayment = { ...storedPayment, status, updated_at: now }
        return updatedPayment
      })

      return { payments }
    })

    return { payment: updatedPayment, error: transitionError }
  },
}))

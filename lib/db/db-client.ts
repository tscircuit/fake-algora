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
    const existingPayment = payment.idempotency_key
      ? get().payments.find(
          (existing) => existing.idempotency_key === payment.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return existingPayment
    }

    let createdPayment: Payment | undefined
    set((state) => {
      createdPayment = {
        ...payment,
        payment_id: `pay_${state.idCounter}`,
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, createdPayment],
        idCounter: state.idCounter + 1,
      }
    })

    return createdPayment!
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const payment = get().payments.find(
      (existing) => existing.payment_id === paymentId,
    )

    if (!payment) {
      return undefined
    }

    const updatedPayment = {
      ...payment,
      status,
      updated_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: state.payments.map((existing) =>
        existing.payment_id === paymentId ? updatedPayment : existing,
      ),
    }))

    return updatedPayment
  },
}))

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
  createPayment: (
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "completed_at" | "canceled_at"
    >,
  ) => {
    const existingPayment = payment.idempotency_key
      ? get().payments.find(
          (currentPayment) =>
            currentPayment.idempotency_key === payment.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return { payment: existingPayment, idempotent_replay: true }
    }

    const newPayment: Payment = {
      ...payment,
      payment_id: `pay_${get().paymentIdCounter}`,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: [...state.payments, newPayment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return { payment: newPayment, idempotent_replay: false }
  },
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    const currentPayment = get().payments.find(
      (payment) => payment.payment_id === payment_id,
    )

    if (!currentPayment) {
      return null
    }

    if (currentPayment.status !== "pending") {
      return currentPayment
    }

    const updatedPayment = {
      ...currentPayment,
      status,
      ...(status === "completed"
        ? { completed_at: new Date().toISOString() }
        : { canceled_at: new Date().toISOString() }),
    }

    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === payment_id ? updatedPayment : payment,
      ),
    }))

    return updatedPayment
  },
}))

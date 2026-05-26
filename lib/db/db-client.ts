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

type NewPayment = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
>

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
      ...paymentInput,
      payment_id: `payment_${get().paymentIdCounter}`,
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return payment
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const now = new Date().toISOString()
    const existingPayment = get().payments.find(
      (payment) => payment.payment_id === paymentId,
    )

    if (!existingPayment) {
      return undefined
    }

    const updatedPayment: Payment = {
      ...existingPayment,
      status,
      updated_at: now,
    }

    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === paymentId ? updatedPayment : payment,
      ),
    }))

    return updatedPayment
  },
}))

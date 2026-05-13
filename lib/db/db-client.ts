import { createStore, type StoreApi } from "zustand/vanilla"
import { immer } from "zustand/middleware/immer"
import { hoist, type HoistedStoreApi } from "zustand-hoist"

import { databaseSchema, type DatabaseSchema, type Payment, type Thing } from "./schema.ts"
import { combine } from "zustand/middleware"

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
    payment: Omit<Payment, "payment_id" | "status" | "created_at" | "updated_at">,
  ) => {
    const existingPayment =
      payment.idempotency_key &&
      get().payments.find(
        (item) => item.idempotency_key === payment.idempotency_key,
      )

    if (existingPayment) return existingPayment

    const timestamp = new Date().toISOString()
    const paymentToCreate: Payment = {
      ...payment,
      currency: payment.currency.toUpperCase(),
      payment_id: get().paymentIdCounter.toString(),
      status: "sent",
      created_at: timestamp,
      updated_at: timestamp,
    }

    set((state) => ({
      payments: [...state.payments, paymentToCreate],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return paymentToCreate
  },
  getPayment: (payment_id: string) => {
    return get().payments.find((payment) => payment.payment_id === payment_id)
  },
}))

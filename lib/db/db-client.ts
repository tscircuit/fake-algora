import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
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
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    const timestamp = new Date().toISOString()
    let updatedPayment: Payment | undefined

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) return payment

        updatedPayment = {
          ...payment,
          status,
          updated_at: timestamp,
        }
        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))

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

type CreatePaymentInput = Omit<
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
  createPayment: (paymentInput: CreatePaymentInput) => {
    const existingPayment = paymentInput.idempotency_key
      ? get().payments.find(
          (payment) => payment.idempotency_key === paymentInput.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return { payment: existingPayment, replayed: true }
    }

    const now = new Date().toISOString()
    const payment: Payment = {
      ...paymentInput,
      payment_id: get().idCounter.toString(),
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      idCounter: state.idCounter + 1,
    }))

    return { payment, replayed: false }
  },
  updatePaymentStatus: (
    paymentId: string,
    status: PaymentStatus,
  ): Payment | undefined => {
    let updatedPayment: Payment | undefined
    const now = new Date().toISOString()

    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.payment_id !== paymentId) {
          return payment
        }

        updatedPayment = {
          ...payment,
          status,
          updated_at: now,
        }

        return updatedPayment
      }),
    }))

    return updatedPayment
  },
}))
